export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getEventPin } from "../../../lib/db";
import { normalizeName } from "../../../lib/name";

function isFullName(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2;
}

export async function POST(request) {
  noStore();
  const body = await request.json().catch(() => null);
  const rawName = (body?.name || "").trim();
  const pin = (body?.pin || "").trim();

  if (!rawName || rawName.length > 40 || !isFullName(rawName) || !pin) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const eventPin = await getEventPin();
  if (!eventPin || pin !== eventPin) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, name: normalizeName(rawName) });
}
