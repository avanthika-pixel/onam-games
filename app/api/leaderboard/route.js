export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getGameLeaderboards, getPlayerTotals } from "../../../lib/db";

export async function GET() {
  noStore();
  const [byGame, playerTotals] = await Promise.all([
    getGameLeaderboards(),
    getPlayerTotals(),
  ]);
  return NextResponse.json({ ok: true, byGame, playerTotals });
}
