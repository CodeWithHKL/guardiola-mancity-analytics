import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MatchView } from "./view";

export function generateStaticParams() {
  const ms: { id: string }[] = JSON.parse(readFileSync(join(process.cwd(), "public/data/matches.json"), "utf8"));
  return ms.map((m) => ({ id: m.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MatchView id={id} />;
}
