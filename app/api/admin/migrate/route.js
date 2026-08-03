export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { migrateToPlayerOnlySchema } from "../../../../lib/db";

function checkAuth(request) {
  const password = request.headers.get("x-admin-password") || "";
  return password && password === process.env.ADMIN_PASSWORD;
}

// One-time destructive migration from the old team-based schema to the
// player-only schema. Drops the old teams table and the old team_id-based
// scores table, then recreates scores/event_state fresh. Run this once
// after deploying the team-less rebuild.
export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  await migrateToPlayerOnlySchema();
  return NextResponse.json({ ok: true });
}
