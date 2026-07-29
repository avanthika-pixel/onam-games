import { useState } from "react";
import { TEAMS } from "../config";
import { joinTeam } from "../firebase";

export default function TeamSelect({ user, onJoined }) {
  const [team, setTeam] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!team) return;
    setSaving(true);
    setError("");
    try {
      await joinTeam({
        uid: user.uid,
        name: user.displayName || user.email,
        email: user.email,
        team,
      });
      onJoined();
    } catch (e) {
      setError("Couldn't save your team. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="card" style={{ maxWidth: 520 }}>
        <span className="eyebrow">One-time setup</span>
        <h1>Choose your team</h1>
        <p className="sub">
          You'll play as{" "}
          <strong>
            {(user.displayName || user.email || "").replace(/\s+/g, "_")}
            {team ? `_team${team}` : "_team?"}
          </strong>
          . This can't be changed later, so pick carefully.
        </p>
        <div className="team-grid">
          {TEAMS.map((t) => (
            <button
              key={t}
              className={`team-option ${team === t ? "selected" : ""}`}
              onClick={() => setTeam(t)}
            >
              Team {t}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <button
            className="btn btn-primary"
            disabled={!team || saving}
            onClick={handleConfirm}
          >
            {saving ? "Joining…" : "Confirm and start playing"}
          </button>
        </div>
        {error && <div className="error-box">{error}</div>}
      </div>
    </div>
  );
}
