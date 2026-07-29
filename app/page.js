"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TEAMS, COMPANY_NAME, EVENT_NAME } from "../lib/config";
import { getSession, setSession } from "../lib/session";
import PookalamRing from "../components/PookalamRing";
import Footer from "../components/Footer";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [team, setTeam] = useState(TEAMS[0]);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getSession()) router.replace("/dashboard");
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 40) {
      setError("Enter your name (under 40 characters).");
      return;
    }
    if (!pin.trim()) {
      setError("Enter your team's PIN.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, team, pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError("That name, team, or PIN didn't match. Please try again.");
        return;
      }
      setSession({ name: trimmedName, team, teamName: data.teamName });
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-screen center-screen--hero">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <PookalamRing size={56} />
        </div>
        <span className="eyebrow">{COMPANY_NAME.toUpperCase()}</span>
        <h1>{EVENT_NAME}</h1>
        <p className="sub">
          {COMPANY_NAME}'s Onam + 14th-anniversary celebration. Enter your
          name, pick your team, and enter your team's PIN to join.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              type="text"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anjali"
            />
          </div>

          <div className="field">
            <label htmlFor="team">Team</label>
            <select id="team" value={team} onChange={(e) => setTeam(Number(e.target.value))}>
              {TEAMS.map((t) => (
                <option key={t} value={t}>
                  Team {t}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="pin">Team PIN</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="4-digit PIN"
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>

        {error && <div className="error-box">{error}</div>}
      </div>
      <Footer />
    </div>
  );
}
