"use client";

import { useState } from "react";
import { GAMES } from "../../lib/config";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const [pauseBusy, setPauseBusy] = useState(false);
  const [pin, setPin] = useState("");
  const [pinStatus, setPinStatus] = useState("");
  const [players, setPlayers] = useState([]);
  const [scoresBusy, setScoresBusy] = useState("");

  async function unlock(e) {
    e.preventDefault();
    setError("");
    const [pauseRes, pinRes, scoresRes] = await Promise.all([
      fetch("/api/admin/pause", { headers: { "x-admin-password": password } }),
      fetch("/api/admin/pin", { headers: { "x-admin-password": password } }),
      fetch("/api/admin/scores", { headers: { "x-admin-password": password } }),
    ]);
    if (!pauseRes.ok || !pinRes.ok || !scoresRes.ok) {
      setError("Wrong admin password.");
      return;
    }
    const pauseData = await pauseRes.json();
    const pinData = await pinRes.json();
    const scoresData = await scoresRes.json();
    if (pauseData.ok) setPaused(pauseData.paused);
    if (pinData.ok) setPin(pinData.pin || "");
    if (scoresData.ok) setPlayers(scoresData.players);
    setUnlocked(true);
  }

  async function deleteScore(player, gameId) {
    setScoresBusy(`${player}:${gameId || "all"}`);
    const res = await fetch("/api/admin/scores", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ player, gameId }),
    });
    const data = await res.json();
    if (res.ok && data.ok) setPlayers(data.players);
    setScoresBusy("");
  }

  async function togglePause() {
    setPauseBusy(true);
    const next = !paused;
    const res = await fetch("/api/admin/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ paused: next }),
    });
    const data = await res.json();
    if (res.ok && data.ok) setPaused(data.paused);
    setPauseBusy(false);
  }

  async function savePin() {
    setPinStatus("");
    const res = await fetch("/api/admin/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    setPinStatus(data.ok ? "Saved." : "Failed to save.");
  }

  if (!unlocked) {
    return (
      <div className="center-screen">
        <div className="card">
          <span className="eyebrow">Admin</span>
          <h1>Event controls</h1>
          <p className="sub">Enter the admin password to manage the event.</p>
          <form onSubmit={unlock}>
            <div className="field">
              <label htmlFor="pw">Admin password</label>
              <input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Unlock
            </button>
          </form>
          {error && <div className="error-box">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <h2 className="section-title">Scoring</h2>
      <p className="section-sub">
        Scoring is currently <strong>{paused ? "paused" : "live"}</strong>. Pausing
        hides the Play buttons and blocks new score submissions, but keeps the
        site and leaderboard visible. Resume anytime.
      </p>
      <button
        className="btn btn-primary"
        style={{ width: "auto", marginBottom: 40 }}
        onClick={togglePause}
        disabled={pauseBusy}
      >
        {pauseBusy ? "Working…" : paused ? "Resume scoring" : "Pause scoring"}
      </button>

      <h2 className="section-title">Event PIN</h2>
      <p className="section-sub">
        The shared PIN everyone enters alongside their name to join. Changing
        it takes effect immediately — anyone who hasn't logged in yet will
        need the new PIN.
      </p>
      <div className="field" style={{ maxWidth: 240 }}>
        <label htmlFor="pin">PIN</label>
        <input id="pin" value={pin} onChange={(e) => setPin(e.target.value)} />
      </div>
      <button
        className="btn btn-primary"
        style={{ width: "auto" }}
        onClick={savePin}
      >
        Save PIN
      </button>
      {pinStatus && <p style={{ marginTop: 16 }}>{pinStatus}</p>}

      <h2 className="section-title" style={{ marginTop: 48 }}>
        Manage scores
      </h2>
      <p className="section-sub">
        Remove a single game's score for a player, or clear everything they've
        submitted. Takes effect immediately on the leaderboard.
      </p>

      {players.length === 0 && <p style={{ color: "#6b6355" }}>No scores submitted yet.</p>}

      {players.length > 0 && (
        <div className="lb-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Player</th>
                {GAMES.map((g) => (
                  <th key={g.id}>{g.name}</th>
                ))}
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...players]
                .map((p) => ({
                  ...p,
                  total: GAMES.reduce((sum, g) => sum + (p.scores[g.id] || 0), 0),
                }))
                .sort((a, b) => b.total - a.total)
                .map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    {GAMES.map((g) => {
                      const score = p.scores[g.id];
                      const key = `${p.name}:${g.id}`;
                      return (
                        <td key={g.id}>
                          {score === undefined ? (
                            "—"
                          ) : (
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {score}
                              <button
                                type="button"
                                className="linklike"
                                style={{ fontSize: 12 }}
                                disabled={scoresBusy === key}
                                onClick={() => deleteScore(p.name, g.id)}
                                title={`Remove ${p.name}'s ${g.name} score`}
                              >
                                ×
                              </button>
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="score">{p.total}</td>
                    <td>
                      <button
                        type="button"
                        className="btn"
                        style={{ width: "auto", background: "var(--maroon)", color: "var(--white)" }}
                        disabled={scoresBusy === `${p.name}:all`}
                        onClick={() => deleteScore(p.name, null)}
                      >
                        Remove all
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
