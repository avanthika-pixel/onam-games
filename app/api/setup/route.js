export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { ensureSchema } from "../../../lib/db";

// Idempotent — safe to hit any time to make sure tables exist.
export async function POST() {
  await ensureSchema();
  return NextResponse.json({ ok: true });
}
