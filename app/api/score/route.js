export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getPlayerBestScores, submitScore } from "../../../lib/db";
import { GAMES, isEventOver } from "../../../lib/config";

const GAME_IDS = new Set(GAMES.map((g) => g.id));

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const team = Number(searchParams.get("team"));
  const name = (searchParams.get("name") || "").trim();

  if (!Number.isInteger(team) || !name) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const best = await getPlayerBestScores(team, name);
  return NextResponse.json({ ok: true, best });
}

export async function POST(request) {
  if (isEventOver()) {
    return NextResponse.json({ ok: false, error: "event_closed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const team = Number(body?.team);
  const name = (body?.name || "").trim();
  const gameId = body?.gameId;
  const score = Number(body?.score);

  if (
    !Number.isInteger(team) ||
    !name ||
    !GAME_IDS.has(gameId) ||
    !Number.isFinite(score) ||
    score < 0
  ) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  await submitScore({ teamId: team, playerName: name, gameId, score: Math.floor(score) });
  const best = await getPlayerBestScores(team, name);
  return NextResponse.json({ ok: true, best });
}
