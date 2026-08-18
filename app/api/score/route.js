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

// Loose, generous minimum real-world time a genuine play session must have
// taken to produce a given score — not exact game-by-game timing, just
// enough to reject a token being redeemed the instant it's issued instead
// of after actually playing. Boat's score formula is exactly
// floor(elapsed_ms / 100), so its floor is derived precisely rather than
// guessed; the rest use flat, easily-cleared floors.
const FLAT_MIN_ELAPSED_MS = {
  pookalam: 3000,
  anniversary: 3000,
  sadya: 5000,
  lootswipe: 3000,
  pookalamecho: 3000,
  bugsquash: 3000,
};

function minElapsedMs(gameId, score) {
  if (gameId === "boat") return Math.max(2000, score * 100 * 0.85);
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
