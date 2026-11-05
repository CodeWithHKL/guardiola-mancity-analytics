"use client";
import { useSyncExternalStore } from "react";

const THEMES = [
  { id: "blue", label: "Blue" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

type Theme = (typeof THEMES)[number]["id"];

const listeners = new Set<() => void>();
const current = (): Theme => (document.documentElement.dataset.theme as Theme) || "blue";

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => void listeners.delete(cb);
}

function setTheme(t: Theme) {
  const apply = () => {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch {}
    listeners.forEach((l) => l());
  };
  // Top-to-bottom wipe via the View Transitions API (styles in globals.css); falls back to an instant swap where unsupported (reduced-motion is deliberately not checked).
  if (document.startViewTransition) {
    document.startViewTransition(apply);
  } else {
    apply();
  }
}

/** Three-way theme switch in the navbar; the choice is saved in localStorage. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, current, () => "blue" as Theme);
  return (
    <div role="group" aria-label="Colour theme" className="ml-auto flex border border-line font-display text-base font-medium">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTheme(t.id)}
          aria-pressed={theme === t.id}
          className={`px-3 py-0.5 ${theme === t.id ? "bg-sky text-background" : "text-foreground/70 hover:text-sky"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
