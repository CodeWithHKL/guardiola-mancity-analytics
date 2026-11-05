/** Trophies won under Guardiola at Manchester City, 2016/17 to 2025/26 (Premier League and all cups). */
export interface Trophy {
  name: string;
  count: number;
  image: string;
}

export const TROPHIES: Trophy[] = [
  { name: "Premier League", count: 6, image: "premier-league" },
  { name: "League Cup", count: 5, image: "league-cup" },
  { name: "FA Cup", count: 3, image: "fa-cup" },
  { name: "Community Shield", count: 3, image: "community-shield" },
  { name: "Champions League", count: 1, image: "champions-league" },
  { name: "UEFA Super Cup", count: 1, image: "super-cup" },
  { name: "Club World Cup", count: 1, image: "club-world-cup" },
];

export const TROPHY_TOTAL = TROPHIES.reduce((t, x) => t + x.count, 0);

/** Looping marquee of trophies with their counts; pauses on hover. */
export function TrophyMarquee() {
  const items = [...TROPHIES, ...TROPHIES];
  return (
    <div className="trophy-marquee relative mx-auto w-full max-w-5xl select-none overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-background to-transparent md:w-32" />
      <div className="marquee-inner flex w-max">
        {items.map((t, i) => (
          <div key={i} className="mx-3 flex h-80 w-48 shrink-0 flex-col items-center justify-between border border-line bg-[#0a1724] text-white px-3 py-4 text-center" aria-hidden={i >= TROPHIES.length}>
            <span className="font-display text-5xl font-semibold leading-none tabular-nums text-white">{t.count}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/trophies/${t.image}.webp`} alt={t.name} draggable={false} className="min-h-0 flex-1 object-contain py-3" />
            <span className="text-sm text-[#b3c8ec]">{t.name}</span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-background to-transparent md:w-32" />
    </div>
  );
}
