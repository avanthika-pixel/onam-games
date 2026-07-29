export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
  const count = await sql`SELECT COUNT(*) FROM scores;`;
  const rows = await sql`SELECT * FROM scores;`;
  return NextResponse.json({ ok: true, count: count.rows, rows: rows.rows, now: (await sql`SELECT now();`).rows });
}
