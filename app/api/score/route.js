export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getPlayerBestScores, submitScore, isPaused } from "../../../lib/db";
import { GAMES, isEventOver } from "../../../lib/config";

const GAME_IDS = new Set(GAMES.map((g) => g.id));

export async function GET(request) {
  noStore();
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get("name") || "").trim();

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
  const name = (body?.name || "").trim();
  const gameId = body?.gameId;
  const score = Number(body?.score);

  if (!name || !GAME_IDS.has(gameId) || !Number.isFinite(score) || score < 0) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  await submitScore({ playerName: name, gameId, score: Math.floor(score) });
  const best = await getPlayerBestScores(name);
  return NextResponse.json({ ok: true, best });
}
