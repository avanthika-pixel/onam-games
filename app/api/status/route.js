export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { isPaused } from "../../../lib/db";
import { isEventOver } from "../../../lib/config";

export async function GET() {
  noStore();
  const paused = await isPaused();
  return NextResponse.json({ ok: true, paused, eventOver: isEventOver() });
}
