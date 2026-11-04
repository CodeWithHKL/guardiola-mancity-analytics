"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, DataTable, FilterBar, Loading, ResultChip, type Col } from "@/components/ui";
import { filterMatches, useFilters, useMatches } from "@/lib/data";
import type { MatchSummary } from "@/lib/types";

export default function MatchesPage() {
  const { data, error } = useMatches();
  const f = useFilters();
  const [q, setQ] = useState("");
  const rows = useMemo(() => (data ? filterMatches(data, f).filter((m) => m.opponent.toLowerCase().includes(q.toLowerCase())) : []), [data, f, q]);
  if (!data) return <Loading error={error} />;

  const cols: Col<MatchSummary>[] = [
    { key: "date", header: "Date", value: (m) => m.date, align: "left", render: (m) => m.date.slice(0, 10) },
    { key: "gw", header: "GW", value: (m) => m.gw },
    {
      key: "opp", header: "Opponent", value: (m) => m.opponent, align: "left",
      render: (m) => (
        <Link href={`/matches/${m.id}`} className="font-medium text-sky hover:underline">
          {m.home ? "vs" : "@"} {m.opponent}
        </Link>
      ),
    },
    { key: "score", header: "Score", value: (m) => m.goalsFor - m.goalsAgainst, render: (m) => (<span className="inline-flex items-center gap-2">{m.goalsFor}-{m.goalsAgainst}<ResultChip result={m.result} className="!h-5 !w-5" /></span>) },
    { key: "xg", header: "xG", value: (m) => (m.xgFor ?? -9) - (m.xgAgainst ?? 0), render: (m) => (m.xgFor === null ? "–" : `${m.xgFor.toFixed(2)} : ${m.xgAgainst?.toFixed(2)}`) },
    { key: "pos", header: "Pos after", value: (m) => m.positionAfter ?? 99, render: (m) => m.positionAfter ?? "–" },
    { key: "pts", header: "FPL pts", value: (m) => m.fplPoints },
    { key: "thr", header: "Threat", value: (m) => m.threat, render: (m) => Math.round(m.threat) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold uppercase">Matches</h1>
      <FilterBar />
      <Card note={`${rows.length} matches`}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search opponent…" className="mb-3 w-64 border border-line bg-background px-3 py-1.5" />
        <DataTable rows={rows} cols={cols} initialSort="date" initialDir={-1} rowKey={(m) => m.id} maxHeight="640px" />
      </Card>
    </div>
  );
}
