"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "../../lib/config";
import { getSession } from "../../lib/session";
import TopBar from "../../components/TopBar";
import Footer from "../../components/Footer";

const POLL_MS = 5000;

export default function LeaderboardPage() {
  const router = useRouter();
  const [session, setSessionState] = useState(undefined);
  const [teamTotals, setTeamTotals] = useState([]);
  const [topByGame, setTopByGame] = useState({});
  const [roster, setRoster] = useState(null);

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

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function loadRoster() {
      const res = await fetch(`/api/team?team=${session.team}`);
      const data = await res.json();
      if (!cancelled && data.ok) setRoster(data);
    }

    loadRoster();
    const interval = setInterval(loadRoster, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session]);

  if (!session) {
    return <div className="center-screen">Loading…</div>;
  }

  const topTotal = teamTotals[0]?.total ? Number(teamTotals[0].total) : 0;

  return (
    <div className="shell">
      <TopBar session={session} />
      <div className="content">
        <div className="lb-block">
          <h2 className="section-title">Your Team — {roster?.team?.name || `Team ${session.team}`}</h2>
          <p className="section-sub">
            Only visible to you. Shows everyone on your team who has
            submitted at least one score.
          </p>
          <div className="lb-table-wrap">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Player</th>
                  {GAMES.map((g) => (
                    <th key={g.id}>{g.name}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(!roster || roster.players.length === 0) && (
                  <tr>
                    <td colSpan={GAMES.length + 2} style={{ color: "#a19a89" }}>
                      No one on your team has played yet — be the first.
                    </td>
                  </tr>
                )}
                {roster?.players.map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    {GAMES.map((g) => (
                      <td key={g.id}>{p.scores[g.id] || 0}</td>
                    ))}
                    <td className="score">{p.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lb-block">
          <h2 className="section-title">Team Standings — Level 14</h2>
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
              <div className="lb-table-wrap">
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
            </div>
          );
        })}
      </div>
      <Footer />
    </div>
  );
}
