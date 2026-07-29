export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getTeamByIdAndPin } from "../../../lib/db";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const name = (body?.name || "").trim();
  const team = Number(body?.team);
  const pin = (body?.pin || "").trim();

  if (!name || name.length > 40 || !Number.isInteger(team) || !pin) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const matched = await getTeamByIdAndPin(team, pin);
  if (!matched) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, name, team, teamName: matched.name });
}
