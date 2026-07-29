export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { seedTeams } from "../../../lib/db";

// Hit this once after deploying to create the tables and seed the 4 teams
// with placeholder PINs (1101-1104). Change the real PINs via /admin after.
export async function POST() {
  await seedTeams();
  return NextResponse.json({ ok: true });
}
