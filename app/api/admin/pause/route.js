export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { isPaused, setPaused } from "../../../../lib/db";

function checkAuth(request) {
  const password = request.headers.get("x-admin-password") || "";
  return password && password === process.env.ADMIN_PASSWORD;
}

export async function GET(request) {
  noStore();
  if (!checkAuth(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const paused = await isPaused();
  return NextResponse.json({ ok: true, paused });
}

export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.paused !== "boolean") {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  await setPaused(body.paused);
  return NextResponse.json({ ok: true, paused: body.paused });
}
