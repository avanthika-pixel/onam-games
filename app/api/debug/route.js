export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
  const count = await sql`SELECT COUNT(*) FROM scores;`;
  const rows = await sql`SELECT * FROM scores;`;

  const teamTotals = await sql`
    SELECT t.id, t.name, COALESCE(SUM(s.best_score), 0) AS total
    FROM teams t
    LEFT JOIN scores s ON s.team_id = t.id
    GROUP BY t.id, t.name
    ORDER BY total DESC;
  `;

  const topScores = await sql`
    SELECT s.game_id, s.player_name, s.best_score, t.id AS team_id, t.name AS team_name
    FROM scores s
    JOIN teams t ON t.id = s.team_id
    ORDER BY s.game_id, s.best_score DESC;
  `;

  return NextResponse.json({
    ok: true,
    count: count.rows,
    rows: rows.rows,
    teamTotals: teamTotals.rows,
    topScores: topScores.rows,
    now: (await sql`SELECT now();`).rows,
  });
}
