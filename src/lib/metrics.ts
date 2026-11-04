import type { MatchSummary, PlayerSeason } from "./types";

export const round = (n: number, d = 1) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

export const ord = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const per90 = (value: number, minutes: number) => (minutes > 0 ? (value / minutes) * 90 : 0);
export const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

/** Merge several PlayerSeason rows (e.g. one player across seasons) into one. */
export function sumSeasons(rows: PlayerSeason[]): PlayerSeason | undefined {
  if (!rows.length) return undefined;
  const out: PlayerSeason = { ...rows[0], season: "All" };
  const keys = (Object.keys(out) as (keyof PlayerSeason)[]).filter(
    (k) => typeof out[k] === "number" && k !== "code" && k !== "price",
  );
  for (const k of keys) (out[k] as number) = 0;
  let priceSum = 0;
  let apps = 0;
  for (const r of rows) {
    for (const k of keys) (out[k] as number) += r[k] as number;
    priceSum += r.price * r.apps;
    apps += r.apps;
  }
  out.price = apps ? round(priceSum / apps, 1) : 0;
  out.xg = round(out.xg, 2);
  out.xa = round(out.xa, 2);
  out.xgc = round(out.xgc, 2);
  out.influence = round(out.influence, 1);
  out.creativity = round(out.creativity, 1);
  out.threat = round(out.threat, 1);
  // keep the most recent name/position
  const last = rows[rows.length - 1];
  out.name = last.name;
  out.pos = rows.reduce((a, b) => (b.minutes > a.minutes ? b : a)).pos;
  return out;
}

export interface TeamAgg {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  ppg: number;
  cleanSheets: number;
  /** null when no match in the selection has xG data */
  xgFor: number | null;
  xgAgainst: number | null;
  xgMatches: number;
}

export function aggregateMatches(ms: MatchSummary[]): TeamAgg {
  const wins = ms.filter((m) => m.result === "W").length;
  const draws = ms.filter((m) => m.result === "D").length;
  const withXg = ms.filter((m) => m.xgFor !== null);
  const points = wins * 3 + draws;
  return {
    matches: ms.length,
    wins,
    draws,
    losses: ms.length - wins - draws,
    goalsFor: ms.reduce((s, m) => s + m.goalsFor, 0),
    goalsAgainst: ms.reduce((s, m) => s + m.goalsAgainst, 0),
    points,
    ppg: ms.length ? round(points / ms.length, 2) : 0,
    cleanSheets: ms.filter((m) => m.cleanSheet).length,
    xgFor: withXg.length ? round(withXg.reduce((s, m) => s + (m.xgFor ?? 0), 0), 1) : null,
    xgAgainst: withXg.length ? round(withXg.reduce((s, m) => s + (m.xgAgainst ?? 0), 0), 1) : null,
    xgMatches: withXg.length,
  };
}
