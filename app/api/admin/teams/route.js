export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { listTeams, updateTeam } from "../../../../lib/db";

function checkAuth(request) {
  const password = request.headers.get("x-admin-password") || "";
  return password && password === process.env.ADMIN_PASSWORD;
}

export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const teams = await listTeams();
  return NextResponse.json({ ok: true, teams });
}

export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  const name = (body?.name || "").trim();
  const pin = (body?.pin || "").trim();

  if (!Number.isInteger(id) || !name || !pin) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  await updateTeam(id, name, pin);
  return NextResponse.json({ ok: true });
}
