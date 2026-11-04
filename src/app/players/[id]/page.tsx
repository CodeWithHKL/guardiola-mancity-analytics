import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { PlayerView } from "./view";

export function generateStaticParams() {
  const ps: { code: number }[] = JSON.parse(readFileSync(join(process.cwd(), "public/data/players.json"), "utf8"));
  return [...new Set(ps.map((p) => p.code))].map((code) => ({ id: String(code) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ps: { code: number; name: string }[] = JSON.parse(readFileSync(join(process.cwd(), "public/data/players.json"), "utf8"));
  const p = ps.find((x) => String(x.code) === id);
  return { title: { absolute: `${p?.name ?? "Player"} | Guardiola's Man City` } };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlayerView code={Number(id)} />;
}
