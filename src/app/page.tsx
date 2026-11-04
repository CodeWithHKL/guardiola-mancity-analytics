"use client";
import Link from "next/link";
import { useMemo } from "react";
import { GroupedBars } from "@/components/charts";
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
  // goals vs xG only over the matches that have xG, so both bars cover the same games
  const xgSeasons = seasons
    .map((s) => {
      const xm = all.filter((m) => m.season === s.season && m.xgFor !== null);
      const avg = (f: (m: (typeof xm)[number]) => number) => round(xm.reduce((t, m) => t + f(m), 0) / Math.max(1, xm.length), 2);
      return { season: `${star(s)} (${xm.length})`, n: xm.length, "Goals scored": avg((m) => m.goalsFor), "xG": avg((m) => m.xgFor ?? 0), "Goals conceded": avg((m) => m.goalsAgainst), "xG against": avg((m) => m.xgAgainst ?? 0) };
    })
    .filter((x) => x.n > 0);

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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase">
          Guardiola&apos;s <span className="text-sky">Man City</span>, 2016–2026
        </h1>
        <p className="text-muted">
          Premier League analysis built from Fantasy Premier League data: {all.length} matches across {seasons.length} seasons. Pick a season or venue, then drill into a player or a match.
        </p>
      </div>
      <FilterBar />
      {ms.length === 0 ? (
        <Card>No matches for this filter.</Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
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
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Points per game" note="Always shows every season.">
          <GroupedBars data={perGame} x="season" digits={2} series={[{ key: "Points per game", name: "Points per game" }]} />
        </Card>
        <Card title="Goals per game" note="Scored vs conceded.">
          <GroupedBars data={perGame} x="season" digits={2} series={[{ key: "Goals scored", name: "Scored" }, { key: "Goals conceded", name: "Conceded" }]} />
        </Card>
        <Card title="Goals vs expected goals per game" note="Per match, over matches with xG data (count in brackets). FPL started recording xG partway through 2022/23.">
          <GroupedBars data={xgSeasons} x="season" digits={2} series={[{ key: "Goals scored", name: "Goals" }, { key: "xG", name: "xG" }]} />
        </Card>
        <Card title="Goals conceded vs expected goals against" note="xGA = highest xGC among City players in each match.">
          <GroupedBars data={xgSeasons} x="season" digits={2} series={[{ key: "Goals conceded", name: "Goals conceded" }, { key: "xG against", name: "xGA" }]} />
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
