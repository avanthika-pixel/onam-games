export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getLeaderboard } from "../../../lib/db";

export async function GET() {
  const data = await getLeaderboard();
  return NextResponse.json({ ok: true, ...data });
}
