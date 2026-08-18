export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { createPlaySession, isPaused } from "../../../../lib/db";
import { GAMES, isEventOver } from "../../../../lib/config";
import { normalizeName } from "../../../../lib/name";

const GAME_IDS = new Set(GAMES.map((g) => g.id));

// Called when a player clicks "Play", before the game loads. Issues a
// one-time token that /api/score must present to submit a result — this is
// what ties a score to an actual play session instead of a raw API call.
export async function POST(request) {
  noStore();
  if (isEventOver() || (await isPaused())) {
    return NextResponse.json({ ok: false, error: "event_closed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = normalizeName(body?.name || "");
  const gameId = body?.gameId;

  if (!name || !GAME_IDS.has(gameId)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const token = await createPlaySession(name, gameId);
  return NextResponse.json({ ok: true, token });
}
