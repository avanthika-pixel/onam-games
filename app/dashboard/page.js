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
import PookalamEcho from "../../games/PookalamEcho";
import BugSquash from "../../games/BugSquash";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function ringGradient(games, best, total) {
  if (!total) return "conic-gradient(rgba(255,255,255,0.08) 0deg 360deg)";
  let acc = 0;
  const stops = games.map((g) => {
    const val = best[g.id] || 0;
    const start = (acc / total) * 360;
    acc += val;
    const end = (acc / total) * 360;
    return `${g.accent} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

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

  const total = GAMES.reduce((sum, g) => sum + (best[g.id] || 0), 0);

  return (
    <div className="shell shell--arcade">
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

            <div className="arcade-hero">
              <div className="arcade-hero-copy">
                <span className="arcade-greeting">
                  {getGreeting()}, {session.name.split(" ")[0].toUpperCase()}
                </span>
                <h2 className="section-title">Welcome to Level 14</h2>
                <p className="section-sub">
                  Pick a game and climb the leaderboard — only your best score
                  in each game counts.
                </p>
              </div>

              <div className="stat-ring-card">
                <div className="stat-ring" style={{ background: ringGradient(GAMES, best, total) }}>
                  <div className="stat-ring-hole">
                    <span className="stat-ring-value">{total}</span>
                    <span className="stat-ring-label">Total score</span>
                  </div>
                </div>
                <div className="stat-legend">
                  {GAMES.map((g) => (
                    <div className="stat-legend-item" key={g.id}>
                      <span className="stat-dot" style={{ background: g.accent }} />
                      <span className="stat-legend-name">{g.name}</span>
                      <span className="stat-legend-score">{best[g.id] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

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

        {activeGame && (
          <button className="leave-game-btn" onClick={() => setActiveGame(null)}>
            ← Leave game
          </button>
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
        {activeGame === "pookalamecho" && (
          <PookalamEcho onFinish={(score) => handleFinish("pookalamecho", score)} />
        )}
        {activeGame === "bugsquash" && (
          <BugSquash onFinish={(score) => handleFinish("bugsquash", score)} />
        )}
      </div>
      <Footer />
    </div>
  );
}
