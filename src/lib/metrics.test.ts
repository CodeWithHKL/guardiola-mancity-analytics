import { describe, expect, it } from "vitest";
import { aggregateMatches, ord, per90, sumSeasons } from "./metrics";
import type { MatchSummary, PlayerSeason } from "./types";

describe("per90 / ord", () => {
  it("scales by minutes", () => expect(per90(2, 180)).toBe(1));
  it("handles zero minutes", () => expect(per90(2, 0)).toBe(0));
  it("formats ordinals", () => expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ord)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd"]));
});

const match = (o: Partial<MatchSummary>): MatchSummary => ({
  id: "x", season: "2017/18", gw: 1, date: "2017-08-12T14:00:00Z", opponent: "X", home: true, goalsFor: 2, goalsAgainst: 0,
  result: "W", points: 3, cleanSheet: true, xgFor: 1.5, xgAgainst: 0.5, influence: 0, creativity: 0, threat: 0, fplPoints: 0, bonus: 0,
  positionAfter: 1, ...o,
});

describe("aggregateMatches", () => {
  it("computes record, points and xG only over matches that have it", () => {
    const a = aggregateMatches([match({}), match({ result: "D", points: 1, goalsFor: 1, goalsAgainst: 1, cleanSheet: false, xgFor: null, xgAgainst: null })]);
    expect([a.wins, a.draws, a.losses, a.points, a.goalsFor, a.cleanSheets]).toEqual([1, 1, 0, 4, 3, 1]);
    expect([a.xgFor, a.xgMatches]).toEqual([1.5, 1]);
  });
  it("returns null xG when no data", () => {
    expect(aggregateMatches([match({ xgFor: null, xgAgainst: null })]).xgFor).toBeNull();
  });
});

describe("sumSeasons", () => {
  const p = (goals: number, minutes: number, price: number, xMinutes = 0): PlayerSeason => ({
    code: 1, name: "A", pos: "FWD", season: "x", apps: 10, minutes, goals, assists: 0, cleanSheets: 0, goalsConceded: 0, saves: 0, bonus: 0, bps: 0,
    points: 0, influence: 0, creativity: 0, threat: 0, yellow: 0, red: 0, ownGoals: 0, penMissed: 0, xg: 0.5, xa: 0, xgc: 0, xMinutes, price,
  });
  it("adds numeric fields and weights price by apps", () => {
    const s = sumSeasons([p(3, 900, 10), p(2, 600, 12, 600)])!;
    expect([s.goals, s.minutes, s.apps, s.xg, s.code, s.xMinutes, s.price]).toEqual([5, 1500, 20, 1, 1, 600, 11]);
  });
});
