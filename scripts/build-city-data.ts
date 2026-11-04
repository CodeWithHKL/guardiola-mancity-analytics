/**
 * Builds the Manchester City (Guardiola era, 2016/17 → 2025/26) dataset from the Fantasy Premier League
 * data (official FPL API, archived per gameweek by github.com/vaastav/Fantasy-Premier-League).
 *
 * Run: npm run build-data   (raw downloads are cached in .cache/fpl)
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { round } from "../src/lib/metrics";
import type {
  LineupRow, MatchDetail, MatchSummary, PlayerFile, PlayerMatchRow, PlayerSeason, Pos, TeamSeason,
} from "../src/lib/types";

const BASE = "https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data";
const SEASONS = ["2016-17", "2017-18", "2018-19", "2019-20", "2020-21", "2021-22", "2022-23", "2023-24", "2024-25", "2025-26"];
const CACHE = join(process.cwd(), ".cache", "fpl");
const OUT = join(process.cwd(), "public", "data");
const POS: Record<string, Pos> = { "1": "GK", "2": "DEF", "3": "MID", "4": "FWD" };

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, string>;

async function getText(path: string, optional = false): Promise<string | null> {
  const file = join(CACHE, path.replace(/\//g, "_"));
  if (existsSync(file)) return readFileSync(file, "utf8");
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`${BASE}/${path}`);
      if (res.status === 404 && optional) return null;
      if (!res.ok) throw new Error(`${res.status} ${path}`);
      const text = await res.text();
      mkdirSync(CACHE, { recursive: true });
      writeFileSync(file, text);
      return text;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  return null;
}

const csv = (text: string): Row[] =>
  parse(text, { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true, bom: true });

const num = (r: Row, k: string) => {
  const v = parseFloat(r[k]);
  return Number.isFinite(v) ? v : 0;
};
const isTrue = (v: string | undefined) => (v ?? "").toLowerCase() === "true";
const label = (s: string) => s.replace("-", "/");
const slug = (s: string) => s.replace("/", "-");

interface Raw { code: number; team: string; pos: Pos; web: string; first: string; second: string }

interface SeasonInput {
  rows: Row[];
  raw: Map<string, Raw>;
  teamNames: Map<string, string>;
  hasXg: boolean;
  source: "archive" | "live";
}

const LIVE = "https://fantasy.premierleague.com/api";
const LIVE_SEASON: string | null = null;
const ARCHIVE_ONLY = process.argv.includes("--archive-only");

async function liveJson(path: string): Promise<any> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${LIVE}/${path}`, { headers: { "User-Agent": "guardiola-analytics/0.1" } });
    if (res.ok) return res.json();
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${path}`);
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  throw new Error(`gave up on ${path}`);
}

/** Current season straight from the official FPL API (the archive lags a few gameweeks behind). */
async function loadLive(): Promise<SeasonInput> {
  const boot = await liveJson("bootstrap-static/");
  const raw = new Map<string, Raw>();
  for (const e of boot.elements)
    raw.set(String(e.id), { code: e.code, team: String(e.team), pos: POS[String(e.element_type)] ?? "MID", web: e.web_name, first: e.first_name, second: e.second_name });
  const teamNames = new Map<string, string>(boot.teams.map((t: any) => [String(t.id), t.name]));
  const ids = boot.elements.map((e: any) => e.id as number);
  const rows: Row[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (next < ids.length) {
        const id = ids[next++];
        const sum = await liveJson(`element-summary/${id}/`);
        for (const h of sum.history ?? []) {
          const r: Row = {};
          for (const [k, v] of Object.entries(h)) r[k] = v === null || v === undefined ? "" : String(v);
          r.was_home = h.was_home ? "True" : "False";
          r.fixture = String(h.fixture);
          r.element = String(id);
          rows.push(r);
        }
        if (next % 150 === 0) console.log(`    live: ${next}/${ids.length} players`);
      }
    }),
  );
  return { rows, raw, teamNames, hasXg: rows.length > 0 && "expected_goals" in rows[0], source: "live" };
}

async function loadArchive(s: string): Promise<SeasonInput> {
  const [gwText, rawText, teamsText] = await Promise.all([
    getText(`${s}/gws/merged_gw.csv`),
    getText(`${s}/players_raw.csv`),
    getText(`${s}/teams.csv`, true),
  ]);
  const rows = csv(gwText!);
  const raw = new Map<string, Raw>();
  for (const r of csv(rawText!)) {
    raw.set(r.id, { code: Number(r.code), team: r.team, pos: POS[r.element_type] ?? "MID", web: r.web_name, first: r.first_name, second: r.second_name });
  }
  const teamNames = new Map<string, string>();
  if (teamsText) for (const t of csv(teamsText)) teamNames.set(t.id, t.name);
  else for (const t of csv((await getText("master_team_list.csv"))!)) if (t.season === s) teamNames.set(t.team, t.team_name);
  return { rows, raw, teamNames, hasXg: Object.keys(rows[0] ?? {}).includes("expected_goals"), source: "archive" };
}

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(join(OUT, "matches"), { recursive: true });
  mkdirSync(join(OUT, "players"), { recursive: true });


  const matches: MatchSummary[] = [];
  const details: MatchDetail[] = [];
  const teamSeasons: TeamSeason[] = [];
  const playerSeasons = new Map<string, PlayerSeason>();
  const playerMatches = new Map<number, PlayerMatchRow[]>();
  const latestName = new Map<number, { name: string; season: string }>();

  for (const s of SEASONS) {
    const season = label(s);
    let input = await loadArchive(s);
    // Guardiola's tenure ended with 2025/26, so every season comes from the archive. Set LIVE_SEASON to a season
    // (e.g. "2026-27") to pull an in-progress season straight from the official FPL API instead.
    if (LIVE_SEASON === s && !ARCHIVE_ONLY) {
      try {
        console.log("  fetching current season from the live FPL API…");
        const live = await loadLive();
        if (live.rows.length >= input.rows.length) input = live;
      } catch (e) {
        console.warn("  live API failed, using archive:", (e as Error).message);
      }
    }
    const { rows, raw, teamNames, hasXg } = input;
    const cityId = [...teamNames].find(([, n]) => n === "Man City")?.[0];
    if (!cityId) throw new Error(`Man City not found in ${s}`);

    // ---- fixtures (all teams) --------------------------------------------------------------
    interface Fx { round: number; kickoff: string; h: Map<string, number>; a: Map<string, number>; hs: number; as: number }
    const fx = new Map<string, Fx>();
    for (const r of rows) {
      const hs = parseFloat(r.team_h_score);
      const as = parseFloat(r.team_a_score);
      if (!Number.isFinite(hs) || !Number.isFinite(as)) continue; // not played yet
      const el = raw.get(r.element);
      if (!el) continue;
      let f = fx.get(r.fixture);
      if (!f) fx.set(r.fixture, (f = { round: num(r, "round"), kickoff: r.kickoff_time, h: new Map(), a: new Map(), hs, as }));
      const m = isTrue(r.was_home) ? f.h : f.a;
      m.set(el.team, (m.get(el.team) ?? 0) + 1);
    }
    const top = (m: Map<string, number>) => [...m].sort((a, b) => b[1] - a[1])[0]?.[0];
    const fixtures = [...fx].map(([id, f]) => ({ id, ...f, home: top(f.h)!, away: top(f.a)! })).filter((f) => f.home && f.away);

    // league table + City progress by gameweek
    const tab = new Map<string, { p: number; pts: number; gf: number; ga: number }>();
    for (const id of teamNames.keys()) tab.set(id, { p: 0, pts: 0, gf: 0, ga: 0 });
    const rank = () =>
      [...tab].sort((a, b) => b[1].pts - a[1].pts || b[1].gf - b[1].ga - (a[1].gf - a[1].ga) || b[1].gf - a[1].gf).map(([id]) => id);
    const progress: TeamSeason["progress"] = [];
    const posAfter = new Map<number, number>();
    const rounds = [...new Set(fixtures.map((f) => f.round))].sort((a, b) => a - b);
    for (const g of rounds) {
      for (const f of fixtures.filter((x) => x.round === g)) {
        const H = tab.get(f.home)!, A = tab.get(f.away)!;
        H.p++; A.p++; H.gf += f.hs; H.ga += f.as; A.gf += f.as; A.ga += f.hs;
        if (f.hs > f.as) H.pts += 3; else if (f.hs < f.as) A.pts += 3; else { H.pts++; A.pts++; }
      }
      if (fixtures.some((x) => x.round === g && (x.home === cityId || x.away === cityId))) {
        const pos = rank().indexOf(cityId) + 1;
        progress.push({ gw: g, points: tab.get(cityId)!.pts, position: pos });
        posAfter.set(g, pos);
      }
    }
    const order = rank();
    const table = order.map((id) => {
      const t = tab.get(id)!;
      return { team: teamNames.get(id) ?? id, played: t.p, points: t.pts, gd: t.gf - t.ga, gf: t.gf, ga: t.ga };
    });

    // ---- City matches ----------------------------------------------------------------------
    const cityFx = fixtures.filter((f) => f.home === cityId || f.away === cityId).sort((a, b) => a.kickoff.localeCompare(b.kickoff));
    const byFixture = new Map<string, Row[]>();
    for (const r of rows) byFixture.set(r.fixture, [...(byFixture.get(r.fixture) ?? []), r]);

    const seasonMatches: MatchSummary[] = [];
    for (const f of cityFx) {
      const home = f.home === cityId;
      const gf = home ? f.hs : f.as;
      const ga = home ? f.as : f.hs;
      const all = byFixture.get(f.id) ?? [];
      const mine = all.filter((r) => isTrue(r.was_home) === home && raw.has(r.element));
      const played = mine.filter((r) => num(r, "minutes") > 0);
      // FPL only started recording xG part-way through 2022/23: all-zero matches mean "no data", not "0 xG".
      const xgOk = hasXg && played.some((r) => num(r, "expected_goals") > 0 || num(r, "expected_goals_conceded") > 0);
      const opponent = teamNames.get(home ? f.away : f.home) ?? "?";
      const id = `${slug(season)}-${f.id}`;
      const sum = (k: string) => played.reduce((t, r) => t + num(r, k), 0);
      const summary: MatchSummary = {
        id, season, gw: f.round, date: f.kickoff, opponent, home,
        goalsFor: gf, goalsAgainst: ga,
        result: gf > ga ? "W" : gf < ga ? "L" : "D",
        points: gf > ga ? 3 : gf === ga ? 1 : 0,
        cleanSheet: ga === 0,
        xgFor: xgOk ? round(sum("expected_goals"), 2) : null,
        xgAgainst: xgOk ? round(Math.max(0, ...played.map((r) => num(r, "expected_goals_conceded"))), 2) : null,
        influence: round(sum("influence"), 1), creativity: round(sum("creativity"), 1), threat: round(sum("threat"), 1),
        fplPoints: sum("total_points"), bonus: sum("bonus"),
        positionAfter: posAfter.get(f.round) ?? null,
      };
      seasonMatches.push(summary);

      const lineup: LineupRow[] = played
        .map((r) => {
          const el = raw.get(r.element)!;
          return {
            code: el.code, name: el.web, pos: el.pos, minutes: num(r, "minutes"),
            goals: num(r, "goals_scored"), assists: num(r, "assists"), points: num(r, "total_points"),
            bonus: num(r, "bonus"), bps: num(r, "bps"),
            xg: xgOk ? round(num(r, "expected_goals"), 2) : null,
            xa: xgOk ? round(num(r, "expected_assists"), 2) : null,
            xgc: xgOk ? round(num(r, "expected_goals_conceded"), 2) : null,
            cleanSheet: num(r, "clean_sheets") > 0, yellow: num(r, "yellow_cards"), red: num(r, "red_cards"),
            saves: num(r, "saves"), ownGoals: num(r, "own_goals"), price: num(r, "value") / 10,
          } satisfies LineupRow;
        })
        .sort((a, b) => b.minutes - a.minutes || b.points - a.points);
      const oppScorers = all
        .filter((r) => isTrue(r.was_home) !== home && num(r, "goals_scored") > 0 && raw.has(r.element))
        .map((r) => ({ name: raw.get(r.element)!.web, goals: num(r, "goals_scored") }));
      details.push({ summary, lineup, oppScorers });

      // player accumulators
      for (const r of played) {
        const el = raw.get(r.element)!;
        const key = `${el.code}|${season}`;
        let a = playerSeasons.get(key);
        if (!a) {
          a = {
            code: el.code, name: el.web, pos: el.pos, season, apps: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0,
            goalsConceded: 0, saves: 0, bonus: 0, bps: 0, points: 0, influence: 0, creativity: 0, threat: 0, yellow: 0, red: 0,
            ownGoals: 0, penMissed: 0, xg: 0, xa: 0, xgc: 0, xMinutes: 0, price: 0,
          };
          playerSeasons.set(key, a);
        }
        const mins = num(r, "minutes");
        a.apps++; a.minutes += mins;
        a.goals += num(r, "goals_scored"); a.assists += num(r, "assists"); a.cleanSheets += num(r, "clean_sheets");
        a.goalsConceded += num(r, "goals_conceded"); a.saves += num(r, "saves"); a.bonus += num(r, "bonus"); a.bps += num(r, "bps");
        a.points += num(r, "total_points"); a.influence += num(r, "influence"); a.creativity += num(r, "creativity"); a.threat += num(r, "threat");
        a.yellow += num(r, "yellow_cards"); a.red += num(r, "red_cards"); a.ownGoals += num(r, "own_goals"); a.penMissed += num(r, "penalties_missed");
        a.price += num(r, "value") / 10;
        if (xgOk) { a.xg += num(r, "expected_goals"); a.xa += num(r, "expected_assists"); a.xgc += num(r, "expected_goals_conceded"); a.xMinutes += mins; }
        const prev = latestName.get(el.code);
        if (!prev || prev.season <= season) latestName.set(el.code, { name: el.web, season });
        const pm: PlayerMatchRow = {
          matchId: id, season, gw: f.round, date: f.kickoff, opponent, home, score: `${gf}-${ga}`, result: summary.result,
          minutes: mins, goals: num(r, "goals_scored"), assists: num(r, "assists"), points: num(r, "total_points"), bonus: num(r, "bonus"),
          xg: xgOk ? round(num(r, "expected_goals"), 2) : null, xa: xgOk ? round(num(r, "expected_assists"), 2) : null,
          price: num(r, "value") / 10,
        };
        playerMatches.set(el.code, [...(playerMatches.get(el.code) ?? []), pm]);
      }
    }
    matches.push(...seasonMatches);

    const w = seasonMatches.filter((m) => m.result === "W").length;
    const d = seasonMatches.filter((m) => m.result === "D").length;
    const cityRow = table[order.indexOf(cityId)];
    teamSeasons.push({
      season, played: seasonMatches.length, wins: w, draws: d, losses: seasonMatches.length - w - d,
      goalsFor: seasonMatches.reduce((t, m) => t + m.goalsFor, 0),
      goalsAgainst: seasonMatches.reduce((t, m) => t + m.goalsAgainst, 0),
      points: cityRow.points, position: order.indexOf(cityId) + 1,
      champion: table[0].team, championPoints: table[0].points,
      cleanSheets: seasonMatches.filter((m) => m.cleanSheet).length,
      xgMatches: seasonMatches.filter((m) => m.xgFor !== null).length,
      xgFor: seasonMatches.some((m) => m.xgFor !== null) ? round(seasonMatches.reduce((t, m) => t + (m.xgFor ?? 0), 0), 1) : null,
      xgAgainst: seasonMatches.some((m) => m.xgFor !== null) ? round(seasonMatches.reduce((t, m) => t + (m.xgAgainst ?? 0), 0), 1) : null,
      completed: seasonMatches.length >= 38,
      progress, table,
    });
    console.log(`${season}: ${seasonMatches.length} City matches, ${fixtures.length} league fixtures, City ${cityRow.points} pts (${order.indexOf(cityId) + 1})`);
  }

  // ---- players ------------------------------------------------------------------------------
  const seasons = [...playerSeasons.values()].map((p) => ({
    ...p,
    name: latestName.get(p.code)!.name,
    minutes: Math.round(p.minutes),
    influence: round(p.influence, 1), creativity: round(p.creativity, 1), threat: round(p.threat, 1),
    xg: round(p.xg, 2), xa: round(p.xa, 2), xgc: round(p.xgc, 2),
    price: round(p.price / p.apps, 1),
  }));
  // disambiguate identical display names
  const names = new Map<string, Set<number>>();
  for (const p of seasons) names.set(p.name, (names.get(p.name) ?? new Set()).add(p.code));
  for (const p of seasons) if ((names.get(p.name)?.size ?? 0) > 1) p.name = `${p.name} (${p.code})`;
  writeFileSync(join(OUT, "players.json"), JSON.stringify(seasons));
  const codes = [...new Set(seasons.map((s) => s.code))];
  for (const code of codes) {
    const mine = seasons.filter((s) => s.code === code);
    const main = [...mine].sort((a, b) => b.minutes - a.minutes)[0];
    const file: PlayerFile = {
      code, name: main.name, pos: main.pos, seasons: mine,
      matches: (playerMatches.get(code) ?? []).sort((a, b) => a.date.localeCompare(b.date)),
    };
    writeFileSync(join(OUT, "players", `${code}.json`), JSON.stringify(file));
  }

  matches.sort((a, b) => a.date.localeCompare(b.date));
  writeFileSync(join(OUT, "matches.json"), JSON.stringify(matches));
  for (const d of details) writeFileSync(join(OUT, "matches", `${d.summary.id}.json`), JSON.stringify(d));
  writeFileSync(join(OUT, "seasons.json"), JSON.stringify(teamSeasons));
  console.log(`wrote ${matches.length} matches, ${codes.length} players, ${teamSeasons.length} seasons`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
