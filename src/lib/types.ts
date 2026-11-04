/** Position group derived from FPL element_type. */
export type Pos = "GK" | "DEF" | "MID" | "FWD";

export interface MatchSummary {
  id: string; // `${season}-${fixture}` e.g. "2017/18-38" -> url-safe "2017-18-38"
  season: string; // "2017/18"
  gw: number;
  date: string; // ISO kickoff
  opponent: string;
  home: boolean;
  goalsFor: number;
  goalsAgainst: number;
  result: "W" | "D" | "L";
  points: number;
  cleanSheet: boolean;
  /** Sum of player xG / max player xGC (FPL data, 2022/23 onward). */
  xgFor: number | null;
  xgAgainst: number | null;
  influence: number;
  creativity: number;
  threat: number;
  fplPoints: number;
  bonus: number;
  /** City's league position after this gameweek (all fixtures up to that GW). */
  positionAfter: number | null;
}

export interface LineupRow {
  code: number;
  name: string;
  pos: Pos;
  minutes: number;
  goals: number;
  assists: number;
  points: number;
  bonus: number;
  bps: number;
  xg: number | null;
  xa: number | null;
  xgc: number | null;
  cleanSheet: boolean;
  yellow: number;
  red: number;
  saves: number;
  ownGoals: number;
  price: number; // £m
}

export interface MatchDetail {
  summary: MatchSummary;
  lineup: LineupRow[];
  oppScorers: { name: string; goals: number }[];
}

/** Season totals for one player (or several seasons merged with season = "All"). */
export interface PlayerSeason {
  code: number;
  name: string;
  pos: Pos;
  season: string;
  apps: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  goalsConceded: number;
  saves: number;
  bonus: number;
  bps: number;
  points: number;
  influence: number;
  creativity: number;
  threat: number;
  yellow: number;
  red: number;
  ownGoals: number;
  penMissed: number;
  /** xG/xA/xGC and the minutes they cover (0 for seasons before 2022/23). */
  xg: number;
  xa: number;
  xgc: number;
  xMinutes: number;
  /** Average FPL price in £m. */
  price: number;
}

export interface PlayerMatchRow {
  matchId: string;
  season: string;
  gw: number;
  date: string;
  opponent: string;
  home: boolean;
  score: string; // "3-1"
  result: "W" | "D" | "L";
  minutes: number;
  goals: number;
  assists: number;
  points: number;
  bonus: number;
  xg: number | null;
  xa: number | null;
  price: number;
}

export interface PlayerFile {
  code: number;
  name: string;
  pos: Pos;
  seasons: PlayerSeason[];
  matches: PlayerMatchRow[];
}

export interface TeamSeason {
  season: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  position: number;
  champion: string;
  championPoints: number;
  cleanSheets: number;
  xgFor: number | null;
  xgAgainst: number | null;
  /** matches that have xG data (xG totals only cover these) */
  xgMatches: number;
  completed: boolean; // all 38 league fixtures played
  /** City league progress by gameweek. */
  progress: { gw: number; points: number; position: number }[];
  table: { team: string; played: number; points: number; gd: number; gf: number; ga: number }[];
}
