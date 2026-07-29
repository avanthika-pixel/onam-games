# Onam Games — Team Score Arena

A live, team-based mini-game site for your Onam + 14th-anniversary event.
React + Vite frontend, Firebase (Auth + Firestore) backend.

## What it does

- Employees sign in with their **company Google account** (restricted to your Workspace domain).
- They pick a team from a fixed list (e.g. Team 1–4).
- Their in-app identity becomes `FullName_team<N>`.
- They play 3 mini-games. For each game, only their **personal best score** counts.
- A team's score per game = **sum of every member's personal best** in that game.
- Playing again only updates the team total if the new score beats their own previous best.
- A live leaderboard (Firestore real-time listener, no refresh needed) shows:
  - Team totals per game, and overall.
  - Top individual scores per game.

## 1. Create your Firebase project

1. Go to https://console.firebase.google.com → **Add project**.
2. Enable **Authentication → Sign-in method → Google**.
3. Under Authentication → Settings → **Authorized domains**, add your deployed domain (Vercel/Netlify URL) once you have it.
4. Enable **Firestore Database** (start in production mode — rules are provided below).
5. Go to Project Settings → General → "Your apps" → add a **Web app**. Copy the config object.
6. Paste that config into `src/firebase.js` (replace the placeholder object).

## 2. Restrict login to your company domain

In `src/firebase.js`, the Google provider is already configured with:

```js
provider.setCustomParameters({ hd: "yourcompany.com" });
```

Change `"yourcompany.com"` to your real Workspace domain. This hints Google to only show accounts from that domain, but it's a **UI hint, not real security** — the actual enforcement happens in `firestore.rules` (see below), which rejects writes from any email not ending in your domain. Update the domain there too.

## 3. Configure teams

Edit `src/config.js`:

```js
export const TEAMS = [1, 2, 3, 4]; // add/remove team numbers here
export const EVENT_END = "2026-09-15T18:00:00"; // site goes read-only after this
```

## 4. Deploy Firestore rules

Install the Firebase CLI (`npm install -g firebase-tools`), then from this folder:

```bash
firebase login
firebase init firestore   # point it at this project, keep firestore.rules as-is
firebase deploy --only firestore:rules
```

## 5. Run locally

```bash
npm install
npm run dev
```

## 6. Deploy the frontend

Easiest: push this folder to GitHub and import it into **Vercel** or **Netlify** (auto-detects Vite). Add no environment variables needed — the Firebase web config is public by design (security is enforced by Firestore rules, not by hiding the config).

## Firestore data model

```
users/{uid}
  name: string            // from Google profile
  email: string
  team: number            // 1..N, set once at team-select
  displayId: string        // "FullName_team2"
  bestScores: {
    boat: number,
    pookalam: number,
    anniversary: number
  }
  updatedAt: timestamp
```

The leaderboard listens to the whole `users` collection in real time and aggregates client-side (fine at 50–300 users). If you ever scale past a few thousand, move aggregation into a Cloud Function that maintains a `teams/{n}` summary doc instead.

## The 3 games

1. **Vallam Kali Dash** — boat-racing obstacle dodger, tap/space to paddle in rhythm and steer around rocks and rival boats. Score = distance survived + clean dodges.
2. **Pookalam Rush** — recreate a flower-petal rangoli pattern by tapping the right colors in the right rings before time runs out. Score = correct placements × speed bonus.
3. **14 Candles** — an endless-runner where you collect one candle per "year" while dodging obstacles, working up to 14. Score = candles collected + distance.

## Locking the site after the event

`EVENT_END` in `src/config.js` disables score submission (games still visible, leaderboard stays visible) once the date passes — everything is computed client-side against `Date.now()`, so no server changes needed at cutoff.
