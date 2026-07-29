"use client";

import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [paused, setPaused] = useState(false);
  const [pauseBusy, setPauseBusy] = useState(false);

  async function unlock(e) {
    e.preventDefault();
    setError("");
    const [teamsRes, pauseRes] = await Promise.all([
      fetch("/api/admin/teams", { headers: { "x-admin-password": password } }),
      fetch("/api/admin/pause", { headers: { "x-admin-password": password } }),
    ]);
    const data = await teamsRes.json();
    if (!teamsRes.ok || !data.ok) {
      setError("Wrong admin password.");
      return;
    }
    const pauseData = await pauseRes.json();
    setTeams(data.teams);
    if (pauseRes.ok && pauseData.ok) setPaused(pauseData.paused);
    setUnlocked(true);
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

  function updateField(id, field, value) {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }

  async function save(team) {
    setStatus("");
    const res = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id: team.id, name: team.name, pin: team.pin }),
    });
    const data = await res.json();
    setStatus(data.ok ? `Saved ${team.name}.` : "Failed to save.");
  }

  if (!unlocked) {
    return (
      <div className="center-screen">
        <div className="card">
          <span className="eyebrow">Admin</span>
          <h1>Team settings</h1>
          <p className="sub">Enter the admin password to manage team names and PINs.</p>
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
      <h2 className="section-title">Event controls</h2>
      <p className="section-sub">
        Scoring is currently <strong>{paused ? "paused" : "live"}</strong>. Pausing
        hides the Play buttons and blocks new score submissions, but keeps the
        site and leaderboard visible. Resume anytime.
      </p>
      <button
        className="btn btn-primary"
        style={{ width: "auto", marginBottom: 32 }}
        onClick={togglePause}
        disabled={pauseBusy}
      >
        {pauseBusy ? "Working…" : paused ? "Resume scoring" : "Pause scoring"}
      </button>

      <h2 className="section-title">Team settings</h2>
      <p className="section-sub">Update each team's name and PIN, then save.</p>

      <div className="lb-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>PIN</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>
                  <input
                    value={t.name}
                    onChange={(e) => updateField(t.id, "name", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={t.pin}
                    onChange={(e) => updateField(t.id, "pin", e.target.value)}
                  />
                </td>
                <td>
                  <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => save(t)}>
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {status && <p style={{ marginTop: 16 }}>{status}</p>}
    </div>
  );
}
