import type { Metadata } from "next";

export const metadata: Metadata = { title: "About — Guardiola's Man City" };

const HERO = "/images/pep-trophies.jpg";

const sections: { title: string; body: string[] }[] = [
  {
    title: "The story behind this project",
    body: [
      "It started with a TV subscription. Around 2013, my dad signed up for Astro, and suddenly Saturday nights belonged to the Barclays Premier League. Somewhere in those first few matches, my dad turned out to be a Manchester City fan. I’m still not sure how it happened, but it was passed down to me like a family heritage, and I never looked back.",
      "Back then, if you had asked me who the best player in the world was, I would have answered “Agüero” without hesitation. Part of it was the mohawk and the shredded, super-saiyan physique. Mostly it was the way he played. He was my idol, the one I looked up to.",
      "I still remember 2013/14, when the whole family sat in front of the TV watching the title race live. When Nasri scored against West Ham, our living room exploded. That was my first Premier League trophy as a City fan, and I’ll never forget it. I wasn’t there for 93:20 in 2011/12, and I can only imagine how insane that felt, but I did get to feel what it means to win with City.",
      "Then came the Mancini era, then Pellegrini, and then the man who changed everything: Pep Guardiola.",
    ],
  },
  {
    title: "The Pep era",
    body: [
      "When Pep arrive at City, he rebuilt the club’s identity. The 2017/18 Centurions season was football the Premier League had never seen, 100 points, 106 goals, relentless possession, and a team that seemed to toy with opponents. In 2018/19 they did it again, fending off a Liverpool side that hit 97 points to win the domestic treble.",
      "Watching Kevin De Bruyne pull defences apart, David Silva gliding between the lines, Sterling and Sané stretching defences, and Agüero finishing it all off was a tactical masterclass. Every pass had a purpose. It felt like watching chess played at full speed.",
    ],
  },
  {
    title: "Goodbye, Kun",
    body: [
      "When Agüero left in 2021, it hurt more than I expected. The man who had been my childhood hero was walking away from the club he defined. Seeing the Etihad stand and applaud him through tears was a reminder that some players aren’t just part of a team but they’re part of your life.",
    ],
  },
  {
    title: "One more miracle",
    body: [
      "Who would have thought I’d get to relive the madness of 2012 again? On the final day of 2021/22, City were 2-0 down to Aston Villa while Liverpool chased us for the title. I was on the edge of my seat next to my dad. We thought there is no hope left as trailing 2-0 seems to be a very steep mountain to climb. Then three goals in five minutes turned the match around and sent the title back to Manchester. We jumped and screamed the moment Gündogan scored the third goal. I’ve never been so happy watching a ball go into the net as I was at that moment.",
    ],
  },
  {
    title: "When the rumours started",
    body: [
      "In early 2026, whispers began that Pep might leave. Even top journalists like Fabrizio Romano reported it, and I refused to believe it. It felt unreal that someone who had been so close to my life, yet whom I had never met, could be leaving my childhood club. I couldn’t picture City without him on the touchline, without those press conferences and sharp one-liners.",
      "I kept hoping he would change his mind, especially when he said, “Let me talk with my owner” in the closing stretch of the season. For a moment, I allowed myself to hope.",
      "Then time ran out, and the official news came. I’ll admit it that I shed some tears. It’s strange to cry over someone you’ve never met, but Pep was part of my childhood in a way I can’t fully explain.",
    ],
  },
  {
    title: "Thank you, Pep",
    body: [
      "He taught me so much about football, and about carrying yourself with class on and off the pitch. I truly believe that we City fans have lived through the peak of happiness as supporters, thanks to this man and the incredible players around him.",
      "This analytics system is my way of saying thank you: a way to dig into the numbers behind the magic that I used to just feel from the sofa.",
    ],
  },
];

export default function About() {
  return (
    <div className="-mt-8 space-y-12 pb-8">
      <div className="relative ml-[calc(50%-50vw)] h-[26rem] w-screen overflow-hidden md:h-[min(46rem,82vh)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO} alt="Pep Guardiola with his Manchester City trophies" className="absolute inset-0 h-full w-full object-cover object-[50%_95%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 via-45% to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
        <div className="relative mx-auto flex h-full max-w-7xl items-end px-6 pb-8 md:pb-10">
          <p className="max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] lg:text-4xl">
            Pep Guardiola is a legendary coach who revolutionized football and turned Manchester City into a dynasty.
          </p>
        </div>
      </div>

      <article className="mx-auto max-w-3xl space-y-10">
        {sections.map((s) => (
          <section key={s.title} className="space-y-4">
            <h2 className="font-display text-3xl font-semibold tracking-tight">{s.title}</h2>
            {s.body.map((p) => (
              <p key={p.slice(0, 40)} className="text-lg leading-relaxed text-foreground/90">{p}</p>
            ))}
          </section>
        ))}
        <p className="border-t border-line pt-6 font-display text-2xl font-semibold text-sky">
          Thank you, Pep Guardiola. You will always be a legend.
        </p>
        <p className="text-xs text-muted">Hero image: Manchester City FC. This is an unofficial fan project.</p>
      </article>
    </div>
  );
}
