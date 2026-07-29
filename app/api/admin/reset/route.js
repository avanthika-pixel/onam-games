export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

function checkAuth(request) {
  const password = request.headers.get("x-admin-password") || "";
  return password && password === process.env.ADMIN_PASSWORD;
}

// Wipes all scores (not teams/PINs). Use before the event goes live to
// clear out test data.
export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  await sql`TRUNCATE TABLE scores;`;
  return NextResponse.json({ ok: true });
}
