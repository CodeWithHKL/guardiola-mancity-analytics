"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  { href: "/", label: "Overview" },
  { href: "/team", label: "Team" },
  { href: "/players", label: "Players" },
  { href: "/matches", label: "Matches" },
  { href: "/about", label: "About" },
];

/**
 * Sticky header that slides away when scrolling down and returns on any scroll up.
 * Publishes --nav-offset (its height while visible, 0 while hidden) so the sticky filter bar can sit just below it.
 */
export function NavBar() {
  const ref = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    let last = window.scrollY;
    let isHidden = false;
    const set = (h: boolean) => {
      isHidden = h;
      setHidden(h);
      root.style.setProperty("--nav-offset", h ? "0px" : `${el.offsetHeight}px`);
    };
    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      const dy = y - last;
      if (y <= el.offsetHeight) { if (isHidden) set(false); }
      else if (dy > 6 && !isHidden) set(true);
      else if (dy < -6 && isHidden) set(false);
      if (Math.abs(dy) > 6) last = y;
    };
    const onResize = () => { if (!isHidden) root.style.setProperty("--nav-offset", `${el.offsetHeight}px`); };
    set(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      root.style.removeProperty("--nav-offset");
    };
  }, []);

  return (
    <header
      ref={ref}
      className={`sticky top-0 z-20 border-b border-line bg-background transition-transform duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"}`}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-1 px-6 py-3">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Guardiola <span className="text-muted">X Man City</span>
        </Link>
        <nav className="flex gap-6 font-display text-lg font-medium">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-foreground/70 hover:text-sky">
              {n.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
