"use client";

import { useRouter } from "next/navigation";
import PookalamRing from "./PookalamRing";
import { clearSession } from "../lib/session";
import { COMPANY_NAME, EVENT_NAME } from "../lib/config";

export default function TopBar({ session }) {
  const router = useRouter();

  function signOut() {
    clearSession();
    router.push("/");
  }

  return (
    <div className="topbar">
      <div className="brand">
        <PookalamRing size={26} />
        <div className="brand-text">
          <span className="brand-eyebrow">{COMPANY_NAME.toUpperCase()}</span>
          <span className="brand-title">{EVENT_NAME}</span>
        </div>
      </div>
      <div className="who">
        <span className="team-tag">
          {session.name} · Team {session.team}
        </span>
        <button className="linklike" onClick={() => router.push("/dashboard")}>
          Games
        </button>
        <button className="linklike" onClick={() => router.push("/leaderboard")}>
          Leaderboard
        </button>
        <button className="linklike" onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
