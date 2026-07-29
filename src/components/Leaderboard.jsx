import { useEffect, useState, useMemo } from "react";
import { watchAllUsers } from "../firebase";
import { TEAMS, GAMES } from "../config";

export default function Leaderboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsub = watchAllUsers(setUsers);
    return unsub;
  }, []);

  const teamTotals = useMemo(() => {
    const totals = {};
    TEAMS.forEach((t) => (totals[t] = { boat: 0, pookalam: 0, anniversary: 0, overall: 0 }));
    users.forEach((u) => {
      if (!totals[u.team]) return;
      GAMES.forEach((g) => {
        const s = u.bestScores?.[g.id] || 0;
        totals[u.team][g.id] += s;
        totals[u.team].overall += s;
      });
    });
    return totals;
  }, [users]);

  const rankedTeams = TEAMS.map((t) => ({ team: t, ...teamTotals[t] })).sort(
    (a, b) => b.overall - a.overall
  );
  const topOverall = rankedTeams[0]?.overall || 0;

  function topPlayers(gameId) {
    return [...users]
      .filter((u) => (u.bestScores?.[gameId] || 0) > 0)
      .sort((a, b) => (b.bestScores?.[gameId] || 0) - (a.bestScores?.[gameId] || 0))
      .slice(0, 5);
  }

  return (
    <div>
      <div className="lb-block">
        <h2 className="section-title">Team standings</h2>
        <p className="section-sub">Live — updates as soon as anyone submits a new best score.</p>
        <div className="lb-teams">
          {rankedTeams.map((t, i) => (
            <div
              key={t.team}
              className={`lb-team-card ${t.overall === topOverall && topOverall > 0 ? "leading" : ""}`}
            >
              <div className="rank">#{i + 1}</div>
              <div className="team-name">Team {t.team}</div>
              <div className="team-score">{t.overall}</div>
            </div>
          ))}
        </div>
      </div>

      {GAMES.map((g) => (
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
              {topPlayers(g.id).length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "#a19a89" }}>
                    No scores yet — be the first to play.
                  </td>
                </tr>
              )}
              {topPlayers(g.id).map((u, i) => (
                <tr key={u.uid}>
                  <td>{i + 1}</td>
                  <td>{u.displayId || u.name}</td>
                  <td>Team {u.team}</td>
                  <td className="score">{u.bestScores?.[g.id] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
