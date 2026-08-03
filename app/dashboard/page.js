"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GAMES, isEventOver } from "../../lib/config";
import { getSession } from "../../lib/session";
import TopBar from "../../components/TopBar";
import Footer from "../../components/Footer";
import BoatRace from "../../games/BoatRace";
import Pookalam from "../../games/Pookalam";
import AnniversaryRun from "../../games/AnniversaryRun";
import SadyaSort from "../../games/SadyaSort";
import LootSwipe from "../../games/LootSwipe";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSessionState] = useState(undefined); // undefined = loading, null = signed out
  const [best, setBest] = useState({});
  const [activeGame, setActiveGame] = useState(null);
  const [paused, setPausedState] = useState(false);
  const over = isEventOver() || paused;

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/");
      return;
    }
    setSessionState(s);
  }, [router]);

  const refreshBest = useCallback(async (s) => {
    const res = await fetch(`/api/score?name=${encodeURIComponent(s.name)}`);
    const data = await res.json();
    if (data.ok) setBest(data.best);
  }, []);

  useEffect(() => {
    if (session) refreshBest(session);
  }, [session, refreshBest]);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const res = await fetch("/api/status");
      const data = await res.json();
      if (!cancelled && data.ok) setPausedState(data.paused);
    }

    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function handleFinish(gameId, score) {
    await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: session.name, gameId, score }),
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
            {isEventOver() && (
              <div className="locked-banner">
                The event has ended — scoring is closed, but the leaderboard stays
                live.
              </div>
            )}
            {!isEventOver() && paused && (
              <div className="locked-banner">
                Scoring is paused for a moment — check back shortly. The
                leaderboard stays live.
              </div>
            )}

            <h2 className="section-title">Welcome to Level 14</h2>
            <p className="section-sub">
              Pick a game and climb the leaderboard — only your best score in
              each game counts.
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
                    {isEventOver() ? "Closed" : paused ? "Paused" : "Play"}
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
        {activeGame === "sadya" && (
          <SadyaSort onFinish={(score) => handleFinish("sadya", score)} />
        )}
        {activeGame === "lootswipe" && (
          <LootSwipe onFinish={(score) => handleFinish("lootswipe", score)} />
        )}
      </div>
      <Footer />
    </div>
  );
}
