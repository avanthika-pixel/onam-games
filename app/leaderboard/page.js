"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "../../lib/config";
import { getSession } from "../../lib/session";
import TopBar from "../../components/TopBar";

const POLL_MS = 5000;

export default function LeaderboardPage() {
  const router = useRouter();
  const [session, setSessionState] = useState(undefined);
  const [teamTotals, setTeamTotals] = useState([]);
  const [topByGame, setTopByGame] = useState({});

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
      if (!cancelled && data.ok) {
        setTeamTotals(data.teamTotals);
        setTopByGame(data.topByGame);
      }
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

  const topTotal = teamTotals[0]?.total ? Number(teamTotals[0].total) : 0;

  return (
    <div className="shell">
      <TopBar session={session} />
      <div className="content">
        <div className="lb-block">
          <h2 className="section-title">Team standings</h2>
          <p className="section-sub">Live — updates automatically every few seconds.</p>
          <div className="lb-teams">
            {teamTotals.map((t, i) => {
              const total = Number(t.total);
              return (
                <div
                  key={t.id}
                  className={`lb-team-card ${total === topTotal && topTotal > 0 ? "leading" : ""}`}
                >
                  <div className="rank">#{i + 1}</div>
                  <div className="team-name">{t.name}</div>
                  <div className="team-score">{total}</div>
                </div>
              );
            })}
          </div>
        </div>

        {GAMES.map((g) => {
          const rows = topByGame[g.id] || [];
          return (
            <div className="lb-block" key={g.id}>
              <h2 className="section-title" style={{ fontSize: 20, color: g.accent }}>
                {g.name} — top scores
              </h2>
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ color: "#a19a89" }}>
                        No scores yet — be the first to play.
                      </td>
                    </tr>
                  )}
                  {rows.map((r, i) => (
                    <tr key={`${r.team_id}-${r.player_name}`}>
                      <td>{i + 1}</td>
                      <td>{r.player_name}</td>
                      <td>{r.team_name}</td>
                      <td className="score">{r.best_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
