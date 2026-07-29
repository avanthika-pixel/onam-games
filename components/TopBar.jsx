"use client";

import { useRouter } from "next/navigation";
import PookalamRing from "./PookalamRing";
import { clearSession } from "../lib/session";

export default function TopBar({ session }) {
  const router = useRouter();

  function signOut() {
    clearSession();
    router.push("/");
  }

  return (
    <div className="topbar">
      <div className="brand">
        <PookalamRing size={28} />
        Team Score Arena
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
