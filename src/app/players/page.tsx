"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, DataTable, FilterBar, Loading, Select, type Col } from "@/components/ui";
import { useFilters, usePlayers } from "@/lib/data";
import { per90, sumSeasons } from "@/lib/metrics";
import type { PlayerSeason } from "@/lib/types";

export default function PlayersPage() {
  const { data, error } = usePlayers();
  const { season } = useFilters();
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("All");
  const rows = useMemo(() => {
    if (!data) return [];
    const by = new Map<number, PlayerSeason[]>();
    for (const r of data) if (season === "All" || r.season === season) by.set(r.code, [...(by.get(r.code) ?? []), r]);
    return [...by.values()]
      .map((v) => sumSeasons(v)!)
      .filter((p) => p.minutes > 0 && (pos === "All" || p.pos === pos) && p.name.toLowerCase().includes(q.toLowerCase()));
  }, [data, season, q, pos]);
  if (!data) return <Loading error={error} />;

  const x = (p: PlayerSeason, v: number) => (p.xMinutes > 0 ? v : null);
  const cols: Col<PlayerSeason>[] = [
    { key: "name", header: "Player", value: (p) => p.name, align: "left", render: (p) => (<Link href={`/players/${p.code}`} className="font-medium text-sky hover:underline">{p.name}</Link>) },
    { key: "pos", header: "Pos", value: (p) => p.pos, align: "left" },
    { key: "apps", header: "Apps", value: (p) => p.apps },
    { key: "min", header: "Min", value: (p) => p.minutes },
    { key: "g", header: "G", value: (p) => p.goals },
    { key: "a", header: "A", value: (p) => p.assists },
    { key: "ga90", header: "G+A /90", value: (p) => per90(p.goals + p.assists, p.minutes), render: (p) => per90(p.goals + p.assists, p.minutes).toFixed(2) },
    { key: "xg", header: "xG*", value: (p) => x(p, p.xg) ?? -1, render: (p) => x(p, p.xg) ?? "–" },
    { key: "xa", header: "xA*", value: (p) => x(p, p.xa) ?? -1, render: (p) => x(p, p.xa) ?? "–" },
    { key: "cs", header: "CS", value: (p) => p.cleanSheets },
    { key: "bonus", header: "Bonus", value: (p) => p.bonus },
    { key: "pts", header: "FPL pts", value: (p) => p.points },
    { key: "ppg", header: "Pts /app", value: (p) => p.points / p.apps, render: (p) => (p.points / p.apps).toFixed(1) },
    { key: "thr", header: "Threat /90", value: (p) => per90(p.threat, p.minutes), render: (p) => Math.round(per90(p.threat, p.minutes)) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Players</h1>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1"><FilterBar venue={false} /></div>
      </div>
      <Card note="Premier League appearances for City under Guardiola. * xG/xA only cover matches where FPL recorded them (late 2022/23 onward), so they are not comparable to career goals and assists (– = no data). Click a column to sort.">
        <div className="mb-3 flex flex-wrap items-center gap-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search player…" className="w-64 border border-line bg-background px-3 py-1.5" />
          <Select label="Position" value={pos} options={["All", "GK", "DEF", "MID", "FWD"]} onChange={setPos} />
          <span className="text-sm text-muted">{rows.length} players</span>
        </div>
        <DataTable rows={rows} cols={cols} initialSort="min" rowKey={(p) => p.code} maxHeight="680px" />
      </Card>
    </div>
  );
}
