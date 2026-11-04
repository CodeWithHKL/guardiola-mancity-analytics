"use client";
import { useEffect, useState } from "react";
import { create } from "zustand";
import type { MatchDetail, MatchSummary, PlayerFile, PlayerSeason, TeamSeason } from "./types";

const cache = new Map<string, Promise<unknown>>();

export function loadJson<T>(path: string): Promise<T> {
  let p = cache.get(path);
  if (!p) {
    p = fetch(`/data/${path}`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${path}`);
      return r.json();
    });
    cache.set(path, p);
  }
  return p as Promise<T>;
}

export function useData<T>(path: string): { data: T | null; error: string | null } {
  const [state, setState] = useState<{ path: string; data: T | null; error: string | null }>({ path, data: null, error: null });
  useEffect(() => {
    let live = true;
    loadJson<T>(path)
      .then((data) => live && setState({ path, data, error: null }))
      .catch((e: Error) => live && setState({ path, data: null, error: e.message }));
    return () => {
      live = false;
    };
  }, [path]);
  return state.path === path ? { data: state.data, error: state.error } : { data: null, error: null };
}

export const useMatches = () => useData<MatchSummary[]>("matches.json");
export const useSeasons = () => useData<TeamSeason[]>("seasons.json");
export const usePlayers = () => useData<PlayerSeason[]>("players.json");
export const usePlayer = (code: number) => useData<PlayerFile>(`players/${code}.json`);
export const useMatch = (id: string) => useData<MatchDetail>(`matches/${id}.json`);

export type Venue = "All" | "Home" | "Away";

interface Filters {
  season: string; // "All" or a season label like "2017/18"
  venue: Venue;
  setSeason: (s: string) => void;
  setVenue: (v: Venue) => void;
}

export const useFilters = create<Filters>((set) => ({
  season: "All",
  venue: "All",
  setSeason: (season) => set({ season }),
  setVenue: (venue) => set({ venue }),
}));

export function filterMatches(ms: MatchSummary[], f: { season: string; venue: Venue }) {
  return ms.filter(
    (m) => (f.season === "All" || m.season === f.season) && (f.venue === "All" || (f.venue === "Home") === m.home),
  );
}
