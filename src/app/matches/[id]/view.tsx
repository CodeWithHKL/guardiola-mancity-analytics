"use client";
import Link from "next/link";
import { Card, DataTable, Loading, ResultChip, StatTile, type Col } from "@/components/ui";
import { GroupedBars } from "@/components/charts";
import { useMatch } from "@/lib/data";
import { ord } from "@/lib/metrics";
import type { LineupRow } from "@/lib/types";

export function MatchView({ id }: { id: string }) {
  const { data, error } = useMatch(id);
  if (!data) return <Loading error={error} />;
  const m = data.summary;
  const scorers = data.lineup.filter((p) => p.goals > 0).map((p) => `${p.name}${p.goals > 1 ? ` ×${p.goals}` : ""}`);
  const own = data.lineup.filter((p) => p.ownGoals > 0).map((p) => `${p.name} (o.g.)`);
  const assists = data.lineup.filter((p) => p.assists > 0).map((p) => `${p.name}${p.assists > 1 ? ` ×${p.assists}` : ""}`);
  const xg = m.xgFor !== null;

  const cols: Col<LineupRow>[] = [
    { key: "name", header: "Player", value: (p) => p.name, align: "left", render: (p) => (<Link href={`/players/${p.code}`} className="font-medium text-sky hover:underline">{p.name}</Link>) },
    { key: "pos", header: "Pos", value: (p) => p.pos, align: "left" },
    { key: "min", header: "Min", value: (p) => p.minutes },
    { key: "g", header: "G", value: (p) => p.goals },
    { key: "a", header: "A", value: (p) => p.assists },
    ...(xg ? [{ key: "xg", header: "xG", value: (p: LineupRow) => p.xg ?? 0 }, { key: "xa", header: "xA", value: (p: LineupRow) => p.xa ?? 0 }] : []),
    { key: "cs", header: "CS", value: (p) => (p.cleanSheet ? 1 : 0), render: (p) => (p.cleanSheet ? "✓" : "") },
    { key: "yc", header: "Cards", value: (p) => p.yellow + p.red * 2, render: (p) => [p.yellow ? `${p.yellow}Y` : "", p.red ? `${p.red}R` : ""].filter(Boolean).join(" ") },
    { key: "bonus", header: "Bonus", value: (p) => p.bonus },
    { key: "bps", header: "BPS", value: (p) => p.bps },
    { key: "pts", header: "FPL pts", value: (p) => p.points },
  ];

  return (
    <div className="space-y-6">
      <Link href="/matches" className="text-sm text-muted hover:text-sky">← All matches</Link>
      <div>
        <div className="text-sm uppercase tracking-wider text-muted">
          Premier League · {m.season} · Gameweek {m.gw} · {m.date.slice(0, 10)}
        </div>
        <h1 className="flex flex-wrap items-center gap-4 font-display text-5xl font-bold uppercase">
          {m.home ? "Man City" : m.opponent} {m.home ? m.goalsFor : m.goalsAgainst}–{m.home ? m.goalsAgainst : m.goalsFor} {m.home ? m.opponent : "Man City"}
          <ResultChip result={m.result} className="!h-9 !w-9 !text-base" />
        </h1>
        <p className="text-muted">
          City goals: {[...scorers, ...own].join(", ") || "–"}
          {assists.length ? ` · Assists: ${assists.join(", ")}` : ""}
          {data.oppScorers.length ? ` · ${m.opponent} goals: ${data.oppScorers.map((s) => `${s.name}${s.goals > 1 ? ` ×${s.goals}` : ""}`).join(", ")}` : ""}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatTile label="Points" value={m.points} sub={m.positionAfter ? `${ord(m.positionAfter)} after GW${m.gw}` : undefined} />
        <StatTile label="xG for : against" value={xg ? `${m.xgFor!.toFixed(2)}:${m.xgAgainst!.toFixed(2)}` : "–"} sub={xg ? undefined : "xG only from 2022/23"} />
        <StatTile label="Threat" value={Math.round(m.threat)} sub="FPL index, team total" />
        <StatTile label="Creativity" value={Math.round(m.creativity)} sub="FPL index, team total" />
        <StatTile label="FPL points" value={m.fplPoints} sub={`${m.bonus} bonus`} />
      </div>
      {xg && (
        <Card title="Goals vs expected goals">
          <GroupedBars
            data={[{ side: "Man City", Goals: m.goalsFor, xG: m.xgFor }, { side: m.opponent, Goals: m.goalsAgainst, xG: m.xgAgainst }]}
            x="side" digits={2} height={200}
            series={[{ key: "Goals", name: "Goals" }, { key: "xG", name: "xG" }]}
          />
        </Card>
      )}
      <Card title="City players" note="Players who got on the pitch. FPL points, bonus and BPS follow FPL scoring rules.">
        <DataTable rows={data.lineup} cols={cols} initialSort="min" rowKey={(p) => p.code} />
      </Card>
    </div>
  );
}
