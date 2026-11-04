"use client";
import Link from "next/link";
import { useMemo } from "react";
import { GroupedBars, SeasonPoints, C1, NEUTRAL } from "@/components/charts";
import { Card, DataTable, FilterBar, Loading, ResultChip, StatTile, type Col } from "@/components/ui";
import { filterMatches, useFilters, useMatches, useSeasons } from "@/lib/data";
import { aggregateMatches, ord, round } from "@/lib/metrics";
import type { TeamSeason } from "@/lib/types";

const star = (s: TeamSeason) => (s.completed ? s.season : `${s.season}*`);

export default function Overview() {
  const { data: all, error } = useMatches();
  const { data: seasons } = useSeasons();
  const f = useFilters();
  const ms = useMemo(() => (all ? filterMatches(all, f) : []), [all, f]);
  const agg = useMemo(() => aggregateMatches(ms), [ms]);
  if (!all || !seasons) return <Loading error={error} />;

  const sel = f.season === "All" ? null : seasons.find((s) => s.season === f.season);
  const titles = seasons.filter((s) => s.completed && s.position === 1).length;
  const done = seasons.filter((s) => s.completed).length;

  const perGame = seasons.map((s) => ({
    season: star(s),
    "Points per game": round(s.points / s.played, 2),
    "Goals scored": round(s.goalsFor / s.played, 2),
    "Goals conceded": round(s.goalsAgainst / s.played, 2),
  }));

  const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
  const best = seasons.reduce((m, s) => (s.points > m.points ? s : m));
  const ppg = (s: TeamSeason) => s.points / s.played;
  const peak = seasons.reduce((m, s) => (ppg(s) > ppg(m) ? s : m));
  const low = seasons.reduce((m, s) => (ppg(s) < ppg(m) ? s : m));
  const bestAtt = seasons.reduce((m, s) => (s.goalsFor / s.played > m.goalsFor / m.played ? s : m));
  const bestDef = seasons.reduce((m, s) => (s.goalsAgainst / s.played < m.goalsAgainst / m.played ? s : m));
  const venuePpg = seasons.map((s) => {
    const ofSeason = all.filter((m) => m.season === s.season);
    const ppgAt = (home: boolean) => {
      const v = ofSeason.filter((m) => m.home === home);
      return round(v.reduce((t, m) => t + m.points, 0) / Math.max(1, v.length), 2);
    };
    return { season: star(s), Home: ppgAt(true), Away: ppgAt(false) };
  });
  const gap = venuePpg.reduce((m, v) => (v.Home - v.Away > m.Home - m.Away ? v : m));
  const csBest = seasons.reduce((m, s) => (s.cleanSheets > m.cleanSheets ? s : m));
  const csData = seasons.map((s) => ({ season: star(s), "Clean sheets": s.cleanSheets }));
  const seasonPoints = seasons.map((s) => ({ season: star(s), points: s.points, finish: ord(s.position), champion: s.position === 1 }));

  const cols: Col<TeamSeason>[] = [
    { key: "season", header: "Season", value: (s) => s.season, align: "left", render: (s) => star(s) },
    { key: "pos", header: "Pos", value: (s) => s.position, render: (s) => ord(s.position) },
    { key: "pts", header: "Pts", value: (s) => s.points },
    { key: "rec", header: "W-D-L", value: (s) => s.wins, render: (s) => `${s.wins}-${s.draws}-${s.losses}` },
    { key: "gf", header: "GF", value: (s) => s.goalsFor },
    { key: "ga", header: "GA", value: (s) => s.goalsAgainst },
    { key: "gd", header: "GD", value: (s) => s.goalsFor - s.goalsAgainst, render: (s) => (s.goalsFor - s.goalsAgainst > 0 ? "+" : "") + (s.goalsFor - s.goalsAgainst) },
    { key: "cs", header: "CS", value: (s) => s.cleanSheets },
    { key: "xgf", header: "xGF", value: (s) => s.xgFor ?? -1, render: (s) => s.xgFor ?? "–" },
    { key: "xga", header: "xGA", value: (s) => s.xgAgainst ?? -1, render: (s) => s.xgAgainst ?? "–" },
    { key: "ch", header: "Champion", value: (s) => s.champion, align: "left", render: (s) => (s.position === 1 ? "Man City" : `${s.champion} (${s.championPoints})`) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Guardiola&apos;s Man City, 2016–2026</h1>
        <p className="text-muted">Premier League only · {all.length} matches · {seasons.length} seasons · source: Fantasy Premier League</p>
      </div>
      <Card title={`${words[titles] ?? titles} league titles in ${done} seasons, peaking at ${best.points} points in ${best.season}`}>
        <div className="mb-2 flex gap-5 text-sm text-muted">
          <span className="flex items-center gap-2"><i className="inline-block h-3 w-3" style={{ background: C1 }} />Champions</span>
          <span className="flex items-center gap-2"><i className="inline-block h-3 w-3" style={{ background: NEUTRAL }} />Other finish</span>
        </div>
        <SeasonPoints data={seasonPoints} selected={sel?.season === undefined ? null : star(sel)} />
      </Card>
      <FilterBar />
      {ms.length === 0 ? (
        <Card>No matches for this filter.</Card>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Record" value={`${agg.wins}-${agg.draws}-${agg.losses}`} sub={`${agg.matches} matches`} />
          <StatTile label="Points" value={agg.points} sub={`${agg.ppg} per game`} />
          <StatTile label="Goals" value={`${agg.goalsFor}:${agg.goalsAgainst}`} sub={`GD ${agg.goalsFor - agg.goalsAgainst > 0 ? "+" : ""}${agg.goalsFor - agg.goalsAgainst}`} />
          <StatTile label="Clean sheets" value={agg.cleanSheets} sub={`${Math.round((agg.cleanSheets / agg.matches) * 100)}% of games`} />
          <StatTile label="xG for : against" value={agg.xgFor === null ? "–" : `${agg.xgFor}:${agg.xgAgainst}`} sub={agg.xgFor === null ? "xG only from late 2022/23" : `${agg.xgMatches} matches with xG`} />
          {sel && f.venue === "All" ? (
            <StatTile label="League finish" value={ord(sel.position)} sub={`${sel.points} pts`} />
          ) : (
            <StatTile label="Titles" value={titles} sub={`in ${done} completed seasons`} />
          )}
        </div>
      )}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-2">
        <Card title={`Points per game peaked at ${round(ppg(peak), 2)} in ${peak.season} and bottomed out at ${round(ppg(low), 2)} in ${low.season}`} note="Always shows every season.">
          <GroupedBars data={perGame} x="season" digits={2} series={[{ key: "Points per game", name: "Points per game" }]} />
        </Card>
        <Card title={`Best attack in ${bestAtt.season} (${round(bestAtt.goalsFor / bestAtt.played, 2)} a game), best defence in ${bestDef.season} (${round(bestDef.goalsAgainst / bestDef.played, 2)})`} note="Goals scored and conceded per game.">
          <GroupedBars data={perGame} x="season" digits={2} series={[{ key: "Goals scored", name: "Scored" }, { key: "Goals conceded", name: "Conceded" }]} />
        </Card>
        <Card title={`Biggest home edge in ${gap.season}: ${gap.Home.toFixed(2)} points a game at home, ${gap.Away.toFixed(2)} away`} note="Points per game by venue.">
          <GroupedBars data={venuePpg} x="season" digits={2} series={[{ key: "Home", name: "Home" }, { key: "Away", name: "Away" }]} />
        </Card>
        <Card title={`Most clean sheets: ${csBest.cleanSheets} in ${csBest.season}`} note="Premier League matches without conceding, per season.">
          <GroupedBars data={csData} x="season" digits={0} series={[{ key: "Clean sheets", name: "Clean sheets" }]} />
        </Card>
      </div>
      <Card title="Season by season">
        <DataTable rows={seasons} cols={cols} initialSort="season" initialDir={1} rowKey={(s) => s.season} />
      </Card>
      {ms.length > 0 && (
        <Card title="Results" note="Click a result to open the match.">
          <div className="flex flex-wrap gap-1">
            {ms.map((m) => (
              <Link key={m.id} href={`/matches/${m.id}`} title={`${m.date.slice(0, 10)} ${m.home ? "vs" : "@"} ${m.opponent} ${m.goalsFor}-${m.goalsAgainst}`} className="hover:outline hover:outline-2 hover:outline-white">
                <ResultChip result={m.result} />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
