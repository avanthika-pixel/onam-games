export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

function checkAuth(request) {
  const password = request.headers.get("x-admin-password") || "";
  return password && password === process.env.ADMIN_PASSWORD;
}

// Temporary diagnostic endpoint — cross-references play_sessions against
// scores to find submissions with an implausibly short gap between
// requesting a play token and the score being recorded. Removed after use.
export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { rows: sessions } = await sql`
    SELECT player_name, game_id, started_at, used
    FROM play_sessions
    ORDER BY player_name, game_id, started_at;
  `;

  const { rows: scores } = await sql`
    SELECT player_name, game_id, best_score, updated_at
    FROM scores
    ORDER BY player_name, game_id;
  `;

  return NextResponse.json({ ok: true, sessions, scores });
}
