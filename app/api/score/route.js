export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getPlayerBestScores, submitScore, isPaused, consumePlaySession } from "../../../lib/db";
import { GAMES, isEventOver } from "../../../lib/config";
import { normalizeName } from "../../../lib/name";

const GAME_IDS = new Set(GAMES.map((g) => g.id));
const MAX_SCORE = Object.fromEntries(GAMES.map((g) => [g.id, g.maxScore]));

// Minimum real-world time a genuine play session must have taken to
// produce a given score. Derived from each game's own client-side timing
// constants wherever the game's structure makes that possible — a flat
// "few seconds" floor turned out to be nowhere near enough for games with
// forced playback/pause sequences (see pookalamecho below, which was
// exploited: its true minimum for a max score is ~185s, not 3s).

// Pookalam Echo: round R's full sequence (R pads x 700ms each) plays in
// full before any tapping is possible, and a 2000ms pause follows every
// completed round. So reaching `correctTaps` total correct taps requires
// having played through every round up to and including the one they were
// on when they stopped — there's no faster path, since rounds can't be
// skipped or repeated.
function pookalamEchoMinMs(score) {
  const ECHO_MAX_ROUNDS = 20; // must match MAX_ROUNDS in games/PookalamEcho.jsx
  const correctTaps = score / 5;
  let completedRounds = 0;
  while (
    ((completedRounds + 1) * (completedRounds + 2)) / 2 <= correctTaps &&
    completedRounds < ECHO_MAX_ROUNDS
  ) {
    completedRounds += 1;
  }

  let playbackMs = 0;
  let pausesMs;
  if (completedRounds >= ECHO_MAX_ROUNDS) {
    // Won outright by finishing round MAX_ROUNDS — the game ends
    // immediately, so no further round ever plays and the pause after
    // the final round never happens either.
    for (let k = 1; k <= ECHO_MAX_ROUNDS; k++) playbackMs += k * 700;
    pausesMs = (ECHO_MAX_ROUNDS - 1) * 2000;
  } else {
    const roundBeingPlayed = completedRounds + 1;
    for (let k = 1; k <= roundBeingPlayed; k++) playbackMs += k * 700;
    pausesMs = completedRounds * 2000;
  }
  return playbackMs + pausesMs;
}

// Loot Swipe: each swipe is gated by a 380ms cooldown, and points per
// correct swipe scale with streak (10 + min(streak,10)*2). Find the fewest
// correct swipes that could reach `score` via the fastest-growing streak
// path, then require at least that many cooldown intervals to have passed.
function lootSwipeMinMs(score) {
  let swipes;
  if (score <= 190) {
    swipes = Math.ceil((-9 + Math.sqrt(81 + 4 * score)) / 2);
  } else {
    swipes = 10 + Math.ceil((score - 190) / 30);
  }
  return Math.max(0, swipes) * 380;
}

// Sadya Sort: every successful match forces a 450ms lock before the next
// flip is accepted. Best case for an attacker is zero wrong flips and the
// full time bonus, so the fewest matches that could explain a given score
// is (score - maxTimeBonus) / pointsPerMatch.
function sadyaMinMs(score) {
  const matches = Math.max(0, Math.ceil((score - 50) / 15));
  return matches * 450;
}

const FLAT_MIN_ELAPSED_MS = {
  pookalam: 3000,
};

function minElapsedMs(gameId, score) {
  if (gameId === "boat") return Math.max(2000, score * 100 * 0.85);
  if (gameId === "pookalamecho") return pookalamEchoMinMs(score);
  if (gameId === "lootswipe") return lootSwipeMinMs(score);
  if (gameId === "sadya") return sadyaMinMs(score);
  if (gameId === "bugsquash") return Math.max(3000, score * 20);
  // Anniversary's score mixes distance and candles, with per-run randomized
  // speed constants the server never sees — an exact derivation like
  // boat's isn't possible. ~40ms/point is close to the fastest either path
  // (distance or candles) could theoretically produce a point, biased
  // permissive to avoid rejecting genuine fast/lucky runs.
  if (gameId === "anniversary") return Math.max(3000, score * 40);
  return FLAT_MIN_ELAPSED_MS[gameId] ?? 2000;
}

export async function GET(request) {
  noStore();
  const { searchParams } = new URL(request.url);
  const name = normalizeName(searchParams.get("name") || "");

  if (!name) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const best = await getPlayerBestScores(name);
  return NextResponse.json({ ok: true, best });
}

export async function POST(request) {
  if (isEventOver() || (await isPaused())) {
    return NextResponse.json({ ok: false, error: "event_closed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = normalizeName(body?.name || "");
  const gameId = body?.gameId;
  const score = Number(body?.score);
  const token = body?.token;

  if (!name || !GAME_IDS.has(gameId) || !Number.isFinite(score) || score < 0) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // Sanity ceiling per game — blocks someone from just POSTing an
  // arbitrary huge number instead of actually playing. Set well above
  // what real play can reach (see lib/config.js).
  if (score > MAX_SCORE[gameId]) {
    return NextResponse.json({ ok: false, error: "score_too_high" }, { status: 400 });
  }

  // Requires proof of an actual play session (see /api/play/start) — a
  // score can't be submitted just by knowing a player's name and calling
  // this endpoint directly.
  if (!token) {
    return NextResponse.json({ ok: false, error: "no_session" }, { status: 403 });
  }
  const session = await consumePlaySession(token, name, gameId);
  if (!session.ok) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 403 });
  }
  if (session.elapsedMs < minElapsedMs(gameId, score)) {
    return NextResponse.json({ ok: false, error: "too_fast" }, { status: 400 });
  }

  await submitScore({ playerName: name, gameId, score: Math.floor(score) });
  const best = await getPlayerBestScores(name);
  return NextResponse.json({ ok: true, best });
}
