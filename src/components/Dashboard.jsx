import { GAMES, isEventOver } from "../config";

export default function Dashboard({ userData, onPlay, onViewLeaderboard }) {
  const over = isEventOver();

  return (
    <div>
      {over && (
        <div className="locked-banner">
          The event has ended — scoring is closed, but the leaderboard stays
          live below.
        </div>
      )}

      <h2 className="section-title">Pick a game</h2>
      <p className="section-sub">
        Only your best score in each game counts toward Team {userData.team}'s
        total.
      </p>

      <div className="game-grid">
        {GAMES.map((g) => (
          <div
            className="game-card"
            key={g.id}
            style={{ "--accent": g.accent }}
          >
            <h3>{g.name}</h3>
            <p>{g.tagline}</p>
            <div className="best">
              Your best: {userData.bestScores?.[g.id] || 0}
            </div>
            <button
              className="btn-play"
              disabled={over}
              onClick={() => onPlay(g.id)}
            >
              {over ? "Closed" : "Play"}
            </button>
          </div>
        ))}
      </div>

      <button className="linklike" onClick={onViewLeaderboard}>
        View full leaderboard →
      </button>
    </div>
  );
}
