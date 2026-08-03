"use client";

import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const [pauseBusy, setPauseBusy] = useState(false);
  const [pin, setPin] = useState("");
  const [pinStatus, setPinStatus] = useState("");

  async function unlock(e) {
    e.preventDefault();
    setError("");
    const [pauseRes, pinRes] = await Promise.all([
      fetch("/api/admin/pause", { headers: { "x-admin-password": password } }),
      fetch("/api/admin/pin", { headers: { "x-admin-password": password } }),
    ]);
    if (!pauseRes.ok || !pinRes.ok) {
      setError("Wrong admin password.");
      return;
    }
    const pauseData = await pauseRes.json();
    const pinData = await pinRes.json();
    if (pauseData.ok) setPaused(pauseData.paused);
    if (pinData.ok) setPin(pinData.pin || "");
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
    </div>
  );
}
