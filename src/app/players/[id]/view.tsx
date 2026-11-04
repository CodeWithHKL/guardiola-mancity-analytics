"use client";
import Link from "next/link";
import { useMemo } from "react";
import { GroupedBars, Radar1, Trend } from "@/components/charts";
import { Card, DataTable, FilterBar, Loading, ResultChip, StatTile, type Col } from "@/components/ui";
import { useFilters, usePlayer, usePlayers } from "@/lib/data";
import { per90, sumSeasons } from "@/lib/metrics";
import type { PlayerMatchRow, PlayerSeason } from "@/lib/types";

const RADAR: { metric: string; f: (p: PlayerSeason) => number }[] = [
  { metric: "FPL pts", f: (p) => per90(p.points, p.minutes) },
  { metric: "Goals", f: (p) => per90(p.goals, p.minutes) },
  { metric: "Assists", f: (p) => per90(p.assists, p.minutes) },
  { metric: "Threat", f: (p) => per90(p.threat, p.minutes) },
  { metric: "Creativity", f: (p) => per90(p.creativity, p.minutes) },
  { metric: "Influence", f: (p) => per90(p.influence, p.minutes) },
  { metric: "Bonus", f: (p) => per90(p.bonus, p.minutes) },
];

export function PlayerView({ code }: { code: number }) {
  const { data: pf, error } = usePlayer(code);
  const { data: all } = usePlayers();
  const { season } = useFilters();

  const seasonRows = useMemo(() => (pf ? pf.seasons.filter((s) => season === "All" || s.season === season) : []), [pf, season]);
  const total = useMemo(() => sumSeasons(seasonRows), [seasonRows]);
  const matches = useMemo(() => (pf ? pf.matches.filter((m) => season === "All" || m.season === season) : []), [pf, season]);

  const radar = useMemo(() => {
    if (!all || !total || !pf || total.minutes < 900) return [];
    const by = new Map<number, PlayerSeason[]>();
    for (const r of all) if (r.pos === pf.pos && (season === "All" || r.season === season)) by.set(r.code, [...(by.get(r.code) ?? []), r]);
    const peers = [...by.values()].map((v) => sumSeasons(v)!).filter((p) => p.minutes >= 900 && p.code !== pf.code);
    return RADAR.map(({ metric, f }) => {
      const v = f(total);
      const below = peers.filter((p) => f(p) < v).length;
      return { metric, value: peers.length ? (below / peers.length) * 100 : 0 };
    });
  }, [all, total, pf, season]);

  if (!pf) return <Loading error={error} />;
  if (!total) {
    return (
      <div className="space-y-6">
        <Link href="/players" className="text-sm text-muted hover:text-sky">← All players</Link>
        <h1 className="font-display text-4xl font-semibold tracking-tight">{pf.name}</h1>
        <FilterBar venue={false} />
        <Card>No Premier League appearances for City in this season.</Card>
      </div>
    );
  }

  const hasX = total.xMinutes > 0;
  const bySeason = pf.seasons.map((s) => ({ season: s.season, Goals: s.goals, Assists: s.assists }));
  const form = matches.map((m, i) => ({ n: i + 1, label: `${m.date.slice(0, 10)} ${m.home ? "vs" : "@"} ${m.opponent}`, Points: m.points }));

  const sCols: Col<PlayerSeason>[] = [
    { key: "season", header: "Season", value: (s) => s.season, align: "left" },
    { key: "apps", header: "Apps", value: (s) => s.apps },
    { key: "min", header: "Min", value: (s) => s.minutes },
    { key: "g", header: "G", value: (s) => s.goals },
    { key: "a", header: "A", value: (s) => s.assists },
    { key: "xg", header: "xG", value: (s) => (s.xMinutes ? s.xg : -1), render: (s) => (s.xMinutes ? s.xg : "–") },
    { key: "xa", header: "xA", value: (s) => (s.xMinutes ? s.xa : -1), render: (s) => (s.xMinutes ? s.xa : "–") },
    { key: "cs", header: "CS", value: (s) => s.cleanSheets },
    { key: "bonus", header: "Bonus", value: (s) => s.bonus },
    { key: "pts", header: "FPL pts", value: (s) => s.points },
    { key: "price", header: "Avg price", value: (s) => s.price, render: (s) => `£${s.price.toFixed(1)}m` },
  ];
  const mCols: Col<PlayerMatchRow>[] = [
    { key: "date", header: "Date", value: (m) => m.date, align: "left", render: (m) => m.date.slice(0, 10) },
    { key: "opp", header: "Match", value: (m) => m.opponent, align: "left", render: (m) => (<Link href={`/matches/${m.matchId}`} className="text-sky hover:underline">{m.home ? "vs" : "@"} {m.opponent}</Link>) },
    { key: "res", header: "Result", value: (m) => m.result, render: (m) => (<span className="inline-flex items-center gap-2">{m.score}<ResultChip result={m.result} className="!h-5 !w-5" /></span>) },
    { key: "min", header: "Min", value: (m) => m.minutes },
    { key: "g", header: "G", value: (m) => m.goals },
    { key: "a", header: "A", value: (m) => m.assists },
    { key: "bonus", header: "Bonus", value: (m) => m.bonus },
    { key: "pts", header: "FPL pts", value: (m) => m.points },
  ];

  return (
    <div className="space-y-6">
      <Link href="/players" className="text-sm text-muted hover:text-sky">← All players</Link>
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">{pf.name}</h1>
        <p className="text-muted">{pf.pos} · {total.apps} apps · {total.minutes} minutes · {pf.seasons[0].season} → {pf.seasons[pf.seasons.length - 1].season} at City</p>
      </div>
      <FilterBar venue={false} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <StatTile label="Goals" value={total.goals} sub={hasX ? `xG ${total.xg}` : undefined} />
        <StatTile label="Assists" value={total.assists} sub={hasX ? `xA ${total.xa}` : undefined} />
        <StatTile label="G+A per 90" value={per90(total.goals + total.assists, total.minutes).toFixed(2)} />
        <StatTile label="FPL points" value={total.points} sub={`${(total.points / total.apps).toFixed(1)} per app`} />
        <StatTile label="Bonus" value={total.bonus} />
        <StatTile label={total.pos === "GK" || total.pos === "DEF" ? "Clean sheets" : "Threat /90"} value={total.pos === "GK" || total.pos === "DEF" ? total.cleanSheets : Math.round(per90(total.threat, total.minutes))} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={`Profile vs ${pf.pos}s`} note={`Share of other City ${pf.pos}s (900+ minutes in the selected period) this player out-produces per 90. 100 = best of the group.`}>
          {radar.length ? <Radar1 data={radar} /> : <p className="py-16 text-center text-muted">Not enough minutes (under 900) for a meaningful comparison.</p>}
        </Card>
        <Card title="Goals and assists by season">
          <GroupedBars data={bySeason} x="season" digits={0} series={[{ key: "Goals", name: "Goals" }, { key: "Assists", name: "Assists" }]} />
        </Card>
        <Card title="FPL points by appearance" note="One point per appearance in the selected period, oldest to newest. The match log below has the detail.">
          <Trend data={form} x="n" series={[{ key: "Points", name: "FPL points" }]} digits={0} zero />
        </Card>
        <Card title="Season by season">
          <DataTable rows={pf.seasons} cols={sCols} initialSort="season" initialDir={1} rowKey={(s) => s.season} />
        </Card>
      </div>
      <Card title="Match log" note="Follows the season filter.">
        <DataTable rows={matches} cols={mCols} initialSort="date" rowKey={(m) => m.matchId} maxHeight="520px" />
      </Card>
    </div>
  );
}
