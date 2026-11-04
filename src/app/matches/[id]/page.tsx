import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { MatchView } from "./view";

export function generateStaticParams() {
  const ms: { id: string }[] = JSON.parse(readFileSync(join(process.cwd(), "public/data/matches.json"), "utf8"));
  return ms.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ms: { id: string; season: string; opponent: string; home: boolean; goalsFor: number; goalsAgainst: number }[] = JSON.parse(
    readFileSync(join(process.cwd(), "public/data/matches.json"), "utf8"),
  );
  const m = ms.find((x) => x.id === id);
  if (!m) return { title: { absolute: "Match | Guardiola's Man City" } };
  const teams = m.home ? `Man City ${m.goalsFor}-${m.goalsAgainst} ${m.opponent}` : `${m.opponent} ${m.goalsAgainst}-${m.goalsFor} Man City`;
  return { title: { absolute: `${teams} (${m.season}) | Guardiola's Man City` } };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MatchView id={id} />;
}
