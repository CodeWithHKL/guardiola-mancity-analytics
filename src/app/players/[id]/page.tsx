import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PlayerView } from "./view";

export function generateStaticParams() {
  const ps: { code: number }[] = JSON.parse(readFileSync(join(process.cwd(), "public/data/players.json"), "utf8"));
  return [...new Set(ps.map((p) => p.code))].map((code) => ({ id: String(code) }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlayerView code={Number(id)} />;
}
