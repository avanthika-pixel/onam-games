export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getTeamRoster } from "../../../lib/db";

export async function GET(request) {
  noStore();
  const { searchParams } = new URL(request.url);
  const team = Number(searchParams.get("team"));

  if (!Number.isInteger(team)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const roster = await getTeamRoster(team);
  if (!roster) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...roster });
}
