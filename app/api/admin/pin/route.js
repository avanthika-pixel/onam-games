export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getEventPin, setEventPin } from "../../../../lib/db";

function checkAuth(request) {
  const password = request.headers.get("x-admin-password") || "";
  return password && password === process.env.ADMIN_PASSWORD;
}

export async function GET(request) {
  noStore();
  if (!checkAuth(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const pin = await getEventPin();
  return NextResponse.json({ ok: true, pin });
}

export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const pin = (body?.pin || "").trim();
  if (!pin) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  await setEventPin(pin);
  return NextResponse.json({ ok: true, pin });
}
