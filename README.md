# Onam Games — Team Score Arena

A live, team-based mini-game site for your Onam + 14th-anniversary event.
Next.js 14 (App Router, JavaScript) + Vercel Postgres. No Firebase, no
per-person accounts — just a name, a team, and that team's shared PIN.

## What it does

- Employees enter their name, pick a team (Team 1–4), and enter that team's
  shared PIN. Their session is stored in `localStorage`.
- They play 3 mini-games. For each game, only their **personal best score**
  counts.
- A team's score per game = **sum of every member's personal best** in that
  game.
- Playing again only updates the total if the new score beats their own
  previous best (enforced atomically in Postgres via an `ON CONFLICT ...
  WHERE` upsert, safe under concurrent submissions).
- A live leaderboard (polls every 5s, no manual refresh needed) shows team
  totals and top individual scores per game.

## 1. Configure teams and the event window

Edit `lib/config.js`:

```js
export const TEAMS = [1, 2, 3, 4]; // add/remove team numbers here
export const EVENT_END = "2026-08-18T17:00:00"; // site goes read-only after this
```

## 2. Run locally

```bash
npm install
npm run dev
```

You'll need a Postgres connection string in `.env.local` (see below) for any
page that touches the database to work locally.

## 3. Deploy

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project**, import the repo.
3. In the project's **Storage** tab, add the **Vercel Postgres** (Neon)
   integration *before* your first deploy — this injects `POSTGRES_URL` and
   friends automatically.
4. Add an `ADMIN_PASSWORD` environment variable (used to protect `/admin`).
5. Deploy.
6. Hit `POST /api/setup` once (e.g. `curl -X POST https://<your-app>/api/setup`)
   to create the tables and seed the 4 teams with placeholder PINs
   (`1101`–`1104`).
7. Visit `/admin`, enter your `ADMIN_PASSWORD`, and set the real team names
   and PINs.

## Data model (Postgres)

```
teams
  id          integer primary key   -- 1..N
  name        text
  pin         text

scores
  id          serial primary key
  team_id     integer references teams(id)
  player_name text
  game_id     text                  -- 'boat' | 'pookalam' | 'anniversary'
  best_score  integer default 0
  updated_at  timestamptz
  unique (team_id, player_name, game_id)
```

## The 3 games

1. **Vallam Kali Dash** — boat-racing obstacle dodger, steer between 3 lanes
   to dodge rocks. Score = survival time, 30s round.
2. **Pookalam Rush** — recreate a flower-petal rangoli pattern by tapping the
   right colors in the right rings before time runs out. Score = correct
   placements + time bonus.
3. **14 Candles** — an endless-runner where you collect one candle per
   "year", working up to 14, while dodging obstacles. Score = candles
   collected + distance.

## Locking the site after the event

`EVENT_END` in `lib/config.js` disables score submission (games still
visible, leaderboard stays visible) once the date passes — checked both
client-side (to grey out the Play buttons) and server-side in
`/api/score` (to reject late submissions).

## Admin

`/admin` is protected by a single shared password (`ADMIN_PASSWORD` env
var) — good enough to keep random employees from changing PINs, not meant
to withstand a determined attacker.
