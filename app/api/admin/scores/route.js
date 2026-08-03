export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getAllPlayerScores, deletePlayerScore, deleteAllPlayerScores } from "../../../../lib/db";

function checkAuth(request) {
  const password = request.headers.get("x-admin-password") || "";
  return password && password === process.env.ADMIN_PASSWORD;
}

export async function GET(request) {
  noStore();
  if (!checkAuth(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const players = await getAllPlayerScores();
  return NextResponse.json({ ok: true, players });
}

// Body: { player: string, gameId?: string }
// gameId present -> delete just that player's score for that game.
// gameId omitted -> delete all of that player's scores.
export async function DELETE(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const player = (body?.player || "").trim();
  const gameId = body?.gameId;

  if (!player) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  if (gameId) {
    await deletePlayerScore(player, gameId);
  } else {
    await deleteAllPlayerScores(player);
  }

  const players = await getAllPlayerScores();
  return NextResponse.json({ ok: true, players });
}
