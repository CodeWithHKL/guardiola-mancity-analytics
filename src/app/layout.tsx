import type { Metadata } from "next";
import { Barlow, Rajdhani } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const rajdhani = Rajdhani({ variable: "--font-rajdhani", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "Overview | Guardiola's Man City", template: "%s | Guardiola's Man City" },
  description: "Player, match and team analytics for Manchester City under Pep Guardiola (2016–2026), from Fantasy Premier League data.",
};

const nav = [
  { href: "/", label: "Overview" },
  { href: "/team", label: "Team" },
  { href: "/players", label: "Players" },
  { href: "/matches", label: "Matches" },
  { href: "/about", label: "About" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${rajdhani.variable} ${barlow.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-line bg-background">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-1 px-6 py-3">
            <Link href="/" className="font-display text-2xl font-semibold tracking-tight text-white">
              Guardiola <span className="text-muted">X Man City</span>
            </Link>
            <nav className="flex gap-6 font-display text-lg font-medium">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="text-white/70 hover:text-sky">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-line px-6 py-4 text-center text-sm text-muted">
          Data: Fantasy Premier League (past seasons via the vaastav archive). Premier League matches only. Unofficial fan project.
        </footer>
      </body>
    </html>
  );
}
