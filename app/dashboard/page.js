"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GAMES, isEventOver } from "../../lib/config";
import { getSession } from "../../lib/session";
import TopBar from "../../components/TopBar";
import BoatRace from "../../games/BoatRace";
import Pookalam from "../../games/Pookalam";
import AnniversaryRun from "../../games/AnniversaryRun";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSessionState] = useState(undefined); // undefined = loading, null = signed out
  const [best, setBest] = useState({});
  const [activeGame, setActiveGame] = useState(null);
  const over = isEventOver();

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/");
      return;
    }
    setSessionState(s);
  }, [router]);

  const refreshBest = useCallback(async (s) => {
    const res = await fetch(`/api/score?team=${s.team}&name=${encodeURIComponent(s.name)}`);
    const data = await res.json();
    if (data.ok) setBest(data.best);
  }, []);

  useEffect(() => {
    if (session) refreshBest(session);
  }, [session, refreshBest]);

  async function handleFinish(gameId, score) {
    await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team: session.team, name: session.name, gameId, score }),
    });
    await refreshBest(session);
    setActiveGame(null);
  }

  if (!session) {
    return <div className="center-screen">Loading…</div>;
  }

  return (
    <div className="shell">
      <TopBar session={session} />
      <div className="content">
        {!activeGame && (
          <>
            {over && (
              <div className="locked-banner">
                The event has ended — scoring is closed, but the leaderboard stays
                live.
              </div>
            )}

            <h2 className="section-title">Pick a game</h2>
            <p className="section-sub">
              Only your best score in each game counts toward Team {session.team}'s
              total.
            </p>

            <div className="game-grid">
              {GAMES.map((g) => (
                <div className="game-card" key={g.id} style={{ "--accent": g.accent }}>
                  <h3>{g.name}</h3>
                  <p>{g.tagline}</p>
                  <div className="best">Your best: {best[g.id] || 0}</div>
                  <button
                    className="btn-play"
                    disabled={over}
                    onClick={() => setActiveGame(g.id)}
                  >
                    {over ? "Closed" : "Play"}
                  </button>
                </div>
              ))}
            </div>

            <button className="linklike" onClick={() => router.push("/leaderboard")}>
              View full leaderboard →
            </button>
          </>
        )}

        {activeGame === "boat" && (
          <BoatRace onFinish={(score) => handleFinish("boat", score)} />
        )}
        {activeGame === "pookalam" && (
          <Pookalam onFinish={(score) => handleFinish("pookalam", score)} />
        )}
        {activeGame === "anniversary" && (
          <AnniversaryRun onFinish={(score) => handleFinish("anniversary", score)} />
        )}
      </div>
    </div>
  );
}
