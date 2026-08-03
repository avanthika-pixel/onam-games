"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "../../lib/config";
import { getSession } from "../../lib/session";
import TopBar from "../../components/TopBar";
import Footer from "../../components/Footer";

const POLL_MS = 5000;
const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const router = useRouter();
  const [session, setSessionState] = useState(undefined);
  const [byGame, setByGame] = useState({});

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

  return (
    <div className="shell">
      <TopBar session={session} />
      <div className="content">
        <h2 className="section-title">Leaderboard — Level 14</h2>
        <p className="section-sub">Live — updates automatically every few seconds.</p>

        {GAMES.map((g) => {
          const rows = byGame[g.id] || [];
          const podium = rows.slice(0, 3);
          const rest = rows.slice(3);

          return (
            <div className="lb-block" key={g.id}>
              <h3 className="game-lb-title" style={{ color: g.accent }}>
                {g.name}
              </h3>

              {podium.length === 0 ? (
                <p style={{ color: "#a19a89" }}>No scores yet — be the first to play.</p>
              ) : (
                <div className="podium">
                  {podium.map((r, i) => (
                    <div className={`podium-spot podium-${i + 1}`} key={r.player_name}>
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
                          <td>{r.player_name}</td>
                          <td className="score">{r.best_score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Footer />
    </div>
  );
}
