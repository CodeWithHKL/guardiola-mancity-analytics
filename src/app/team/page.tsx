"use client";
import { useMemo, useState } from "react";
import { GroupedBars, HBars, Trend } from "@/components/charts";
import { Card, DataTable, FilterBar, Loading, Select, type Col } from "@/components/ui";
import { filterMatches, useFilters, useMatches, usePlayers, useSeasons } from "@/lib/data";
import { aggregateMatches, round, sumSeasons } from "@/lib/metrics";
import type { MatchSummary, PlayerSeason } from "@/lib/types";

interface OppRow { opponent: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number }

export default function TeamPage() {
  const { data: all, error } = useMatches();
  const { data: seasons } = useSeasons();
  const { data: players } = usePlayers();
  const f = useFilters();
  const [a, setA] = useState("2023/24");
  const [b, setB] = useState("2017/18");

  const ms = useMemo(() => (all ? filterMatches(all, f) : []), [all, f]);

  const opp = useMemo(() => {
    const m = new Map<string, OppRow>();
    for (const x of ms) {
      const r = m.get(x.opponent) ?? { opponent: x.opponent, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
      r.p++; r.gf += x.goalsFor; r.ga += x.goalsAgainst; r.pts += x.points;
      if (x.result === "W") r.w++; else if (x.result === "D") r.d++; else r.l++;
      m.set(x.opponent, r);
    }
    return [...m.values()];
  }, [ms]);

  const contributors = useMemo(() => {
    if (!players) return { scorers: [], assisters: [] };
    const by = new Map<number, PlayerSeason[]>();
    for (const p of players) if (f.season === "All" || p.season === f.season) by.set(p.code, [...(by.get(p.code) ?? []), p]);
    const rows = [...by.values()].map((v) => sumSeasons(v)!);
    const top = (k: "goals" | "assists") =>
      rows.filter((r) => r[k] > 0).sort((x, y) => y[k] - x[k]).slice(0, 10).map((r) => ({ name: r.name, value: r[k] }));
    return { scorers: top("goals"), assisters: top("assists") };
  }, [players, f.season]);

  if (!all || !seasons) return <Loading error={error} />;

  const names = seasons.map((s) => s.season);
  const sa = seasons.find((s) => s.season === a);
  const sb = seasons.find((s) => s.season === b);
  const gws = Array.from({ length: 38 }, (_, i) => i + 1);
  const race = gws.map((gw) => ({
    gw,
    A: sa?.progress.find((p) => p.gw === gw)?.points ?? null,
    B: sb?.progress.find((p) => p.gw === gw)?.points ?? null,
  }));
  // fixed keys (not the season names) so comparing a season with itself can't produce duplicate keys
  const raceSeries = a === b ? [{ key: "A", name: a }] : [{ key: "A", name: a }, { key: "B", name: b }];
  const pos = gws.map((gw) => ({
    gw,
    A: sa?.progress.find((p) => p.gw === gw)?.position ?? null,
    B: sb?.progress.find((p) => p.gw === gw)?.position ?? null,
  }));

  const split = (home: boolean) => aggregateMatches(ms.filter((m) => m.home === home));
  const splitRows = [
    { venue: "Home", ...split(true) },
    { venue: "Away", ...split(false) },
  ].filter((r) => r.matches > 0);

  const seasonAvg = (k: "creativity" | "threat" | "influence") =>
    seasons.map((s) => {
      const sm: MatchSummary[] = all.filter((m) => m.season === s.season);
      return { season: s.completed ? s.season : `${s.season}*`, value: round(sm.reduce((t, m) => t + m[k], 0) / Math.max(1, sm.length), 1) };
    });
  const threat = seasonAvg("threat");
  const creat = seasonAvg("creativity");
  const attack = threat.map((t, i) => ({ season: t.season, Threat: t.value, Creativity: creat[i].value }));

  const oppCols: Col<OppRow>[] = [
    { key: "opponent", header: "Opponent", value: (r) => r.opponent, align: "left" },
    { key: "p", header: "P", value: (r) => r.p },
    { key: "w", header: "W", value: (r) => r.w },
    { key: "d", header: "D", value: (r) => r.d },
    { key: "l", header: "L", value: (r) => r.l },
    { key: "gf", header: "GF", value: (r) => r.gf },
    { key: "ga", header: "GA", value: (r) => r.ga },
    { key: "pts", header: "Pts", value: (r) => r.pts },
    { key: "ppg", header: "PPG", value: (r) => r.pts / r.p, render: (r) => (r.pts / r.p).toFixed(2) },
  ];
  type Split = (typeof splitRows)[number];
  const splitCols: Col<Split>[] = [
    { key: "venue", header: "Venue", value: (r) => r.venue, align: "left" },
    { key: "p", header: "P", value: (r) => r.matches },
    { key: "rec", header: "W-D-L", value: (r) => r.wins, render: (r) => `${r.wins}-${r.draws}-${r.losses}` },
    { key: "gf", header: "GF", value: (r) => r.goalsFor },
    { key: "ga", header: "GA", value: (r) => r.goalsAgainst },
    { key: "pts", header: "Pts", value: (r) => r.points },
    { key: "ppg", header: "PPG", value: (r) => r.ppg },
    { key: "cs", header: "CS", value: (r) => r.cleanSheets },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold uppercase">Team analysis</h1>
      <FilterBar />
      <Card title="Title race: compare two seasons">
        <div className="mb-3 flex gap-6">
          <Select label="Season A" value={a} options={names} onChange={setA} />
          <Select label="Season B" value={b} options={names} onChange={setB} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-1 text-sm uppercase tracking-wider text-muted">Cumulative points by gameweek</h3>
            <Trend data={race} x="gw" series={raceSeries} digits={0} />
          </div>
          <div>
            <h3 className="mb-1 text-sm uppercase tracking-wider text-muted">League position after each gameweek</h3>
            <Trend data={pos} x="gw" series={raceSeries} digits={0} reversed domain={[0.5, 10]} ticks={[1, 2, 4, 6, 8, 10]} />
          </div>
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Home vs away" note="Uses the season and venue filters above.">
          <DataTable rows={splitRows} cols={splitCols} initialSort="venue" initialDir={1} rowKey={(r) => r.venue} />
        </Card>
        <Card title="Attacking output per match" note="Team total of FPL's Threat and Creativity scores for City players in each match. These are FPL composite indices, not event counts.">
          <GroupedBars data={attack} x="season" digits={0} series={[{ key: "Threat", name: "Threat" }, { key: "Creativity", name: "Creativity" }]} />
        </Card>
        <Card title="Top scorers">
          <HBars data={contributors.scorers} label="name" value="value" name="Goals" />
        </Card>
        <Card title="Top assists">
          <HBars data={contributors.assisters} label="name" value="value" name="Assists" />
        </Card>
      </div>
      <Card title="Record vs each opponent" note="Premier League only; follows the season and venue filters.">
        <DataTable rows={opp} cols={oppCols} initialSort="p" rowKey={(r) => r.opponent} maxHeight="520px" />
      </Card>
    </div>
  );
}
