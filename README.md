# Guardiola's Man City: Analytics

An interactive dashboard for Manchester City under Pep Guardiola, covering every Premier League match from the 2016/17 season to 2025/26 (380 matches, 10 seasons). Filter by season and venue, then drill into the team, a player, or a single match.

Built with Next.js and TypeScript. It's a static site: all data is pre-generated into JSON files, so there's no server or database to run.

## Features

- **Overview**: record, points, goals, clean sheets and xG tiles, per-game charts, a season-by-season table with league finish, and a results strip linking to each match.
- **Team**: title race for any two seasons (cumulative points and league position by gameweek), home vs away, attacking output, top scorers and assists, and City's record against every opponent.
- **Players**: a sortable, searchable table (filter by season and position). Each player page has stat tiles, a radar showing how the player ranks against other City players in the same position (players with 900+ minutes only), goals and assists by season, FPL points by appearance, a season table and a match log.
- **Matches**: a searchable list. Each match page has the score, scorers, assists, xG, and every City player's minutes, goals, assists and FPL points.
- **About**: the story behind the project, and a scrolling strip of the 20 trophies Guardiola won at City.

## Data

The data comes from the **Fantasy Premier League (FPL)** API. The official API only serves per-match history for the current season, so finished seasons come from the community archive [vaastav/Fantasy-Premier-League](https://github.com/vaastav/Fantasy-Premier-League), which stores the API's weekly data.

Things worth knowing before you read the numbers:

- **Premier League only.** There are no Champions League, FA Cup or League Cup matches, so season totals are lower than all-competition totals.
- **FPL-style stats, not event data.** There are no shot maps, pass maps, heatmaps or pressing numbers. Threat, Creativity and Influence are FPL's own composite scores, not counts.
- **xG and xA are patchy.** FPL started recording them partway through 2022/23. Matches without data show as missing (`–`), not zero, and xG totals only cover matches that have it.
- **Assists** follow FPL's rules and can differ slightly from official records.
- **League tables** are computed from all 380 fixtures per season, so league positions are real. The results match known totals, for example 100 points in 2017/18 and 98 in 2018/19.
- **Matchweeks.** FPL numbered the 2019/20 restart after lockdown as rounds 39–47. The build shifts these back to the real matchweeks 30–38.
- **Tenure.** The dataset ends with 2025/26, Guardiola's last season at City.

## Getting started

Requires Node.js 20 or later.

```bash
npm install
npm run dev          # http://localhost:3000
```

The generated data is committed in `public/data/`, so the app runs straight after install.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the static site into `out/` |
| `npm run build-data` | Re-download the FPL data and regenerate `public/data/` |
| `npm run lint` | Run ESLint |
| `npm test` | Run the unit tests (Vitest) |

### Regenerating the data

`npm run build-data` runs `scripts/build-city-data.ts`. It downloads the archive files, works out City's fixtures, the league tables and every player's per-match stats, and rewrites `public/data/`. Raw downloads are cached in `.cache/fpl/` (git-ignored), so reruns are fast. Delete that folder to force a fresh download.

To pull an in-progress season straight from the live FPL API, set `LIVE_SEASON` in the script (for example `"2026-27"`) and add that season to `SEASONS`. Pass `--archive-only` to skip the live fetch.

### Output files

```
public/data/
  matches.json          all City matches, one summary each
  seasons.json          season totals, league tables, gameweek progress
  players.json          one row per player per season
  matches/<id>.json     lineup and player stats for one match
  players/<code>.json   one player's seasons and match log
```

Don't edit these by hand, since the next build overwrites them.

## Project structure

```
scripts/build-city-data.ts   data pipeline (FPL -> JSON)
src/app/                     pages: overview, team, players, matches, about
src/components/              shared UI, Recharts chart wrappers, trophy marquee
public/images/               hero photo and trophy images (About page)
src/lib/data.ts              data loading hooks and the season/venue filter store
src/lib/metrics.ts           per-90, aggregation and merge helpers (tested)
src/lib/types.ts             data types
```

## Tech stack

- Next.js (App Router, static export), React, TypeScript
- Tailwind CSS, with Rajdhani (headings) and Barlow (body) fonts
- Recharts for charts, Zustand for the filters
- Vitest for tests

The theme uses Manchester City's sky blue and navy with sharp, non-rounded corners. Chart colours are a deeper blue and an orange, checked for contrast and colour-blind separation on the dark background.

## Credits

Data from the Fantasy Premier League API and the [vaastav/Fantasy-Premier-League](https://github.com/vaastav/Fantasy-Premier-League) archive. The About page hero and the Premier League, Champions League, FA Cup, Super Cup and Club World Cup trophy images come from a Manchester City FC photo. The League Cup trophy (MacMoreno) and Community Shield (Riccardo de Conciliis) images are from [Wikimedia Commons](https://commons.wikimedia.org/) under CC BY-SA. This is an unofficial fan project and is not affiliated with Manchester City, the Premier League or Fantasy Premier League.
