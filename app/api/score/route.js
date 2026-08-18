export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getPlayerBestScores, submitScore, isPaused } from "../../../lib/db";
import { GAMES, isEventOver } from "../../../lib/config";
import { normalizeName } from "../../../lib/name";

const GAME_IDS = new Set(GAMES.map((g) => g.id));
const MAX_SCORE = Object.fromEntries(GAMES.map((g) => [g.id, g.maxScore]));

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

  if (!name || !GAME_IDS.has(gameId) || !Number.isFinite(score) || score < 0) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // Sanity ceiling per game — blocks someone from just POSTing an
  // arbitrary huge number instead of actually playing. Set well above
  // what real play can reach (see lib/config.js).
  if (score > MAX_SCORE[gameId]) {
    return NextResponse.json({ ok: false, error: "score_too_high" }, { status: 400 });
  }

  await submitScore({ playerName: name, gameId, score: Math.floor(score) });
  const best = await getPlayerBestScores(name);
  return NextResponse.json({ ok: true, best });
}
