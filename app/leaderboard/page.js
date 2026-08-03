"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "../../lib/config";
import { getSession } from "../../lib/session";
import TopBar from "../../components/TopBar";
import Footer from "../../components/Footer";

const POLL_MS = 5000;
const MEDALS = ["🥇", "🥈", "🥉"];

function initials(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [session, setSessionState] = useState(undefined);
  const [byGame, setByGame] = useState({});
  const [selectedGame, setSelectedGame] = useState(GAMES[0].id);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/");
      return;
    }
    setSessionState(s);
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (!cancelled && data.ok) setByGame(data.byGame);
    }

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!session) {
    return <div className="center-screen">Loading…</div>;
  }

  const activeGame = GAMES.find((g) => g.id === selectedGame) || GAMES[0];
  const rows = byGame[activeGame.id] || [];
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="shell shell--arcade">
      <TopBar session={session} />
      <div className="content">
        <h2 className="section-title">Leaderboard — Level 14</h2>
        <p className="section-sub">Live — updates automatically every few seconds.</p>

        <div className="arcade-tabs">
          {GAMES.map((g) => (
            <button
              key={g.id}
              className={`arcade-tab ${g.id === selectedGame ? "active" : ""}`}
              style={{ "--tab-accent": g.accent }}
              onClick={() => setSelectedGame(g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>

        <div className="lb-panel">
          <h3 className="game-lb-title" style={{ color: activeGame.accent }}>
            {activeGame.name}
          </h3>

          {podium.length === 0 ? (
            <p className="lb-empty">No scores yet — be the first to play.</p>
          ) : (
            <div className="podium">
              {podium.map((r, i) => (
                <div className={`podium-spot podium-${i + 1}`} key={r.player_name}>
                  {i === 0 && <div className="podium-crown">👑</div>}
                  <div className="avatar">{initials(r.player_name)}</div>
                  <div className="podium-medal">{MEDALS[i]}</div>
                  <div className="podium-name">{r.player_name}</div>
                  <div className="podium-score">{r.best_score}</div>
                </div>
              ))}
            </div>
          )}

          {rest.length > 0 && (
            <div className="lb-table-wrap">
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((r, i) => (
                    <tr key={r.player_name}>
                      <td>{i + 4}</td>
                      <td>
                        <div className="lb-row-player">
                          <div className="avatar avatar-sm">{initials(r.player_name)}</div>
                          {r.player_name}
                        </div>
                      </td>
                      <td className="score">{r.best_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
