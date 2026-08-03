export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getGameLeaderboards } from "../../../lib/db";

export async function GET() {
  noStore();
  const byGame = await getGameLeaderboards();
  return NextResponse.json({ ok: true, byGame });
}
