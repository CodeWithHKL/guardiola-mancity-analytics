import type { Metadata } from "next";
import { Barlow, Rajdhani } from "next/font/google";
import { NavBar } from "@/components/navbar";
import "./globals.css";

const rajdhani = Rajdhani({ variable: "--font-rajdhani", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "Overview | Guardiola's Man City", template: "%s | Guardiola's Man City" },
  description: "Player, match and team analytics for Manchester City under Pep Guardiola (2016–2026), from Fantasy Premier League data.",
};

// Runs before first paint so a saved theme does not flash the default.
const themeInit = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"||t==="blue")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${rajdhani.variable} ${barlow.variable} h-full antialiased`} data-theme="blue" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="flex min-h-full flex-col">
        <NavBar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-line px-6 py-4 text-center text-sm text-muted">
          Data: Fantasy Premier League (past seasons via the vaastav archive). Premier League matches only. Unofficial fan project.
        </footer>
      </body>
    </html>
  );
}
