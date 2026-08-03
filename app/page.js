"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COMPANY_NAME, EVENT_NAME, PLAYERS } from "../lib/config";
import { getSession, setSession } from "../lib/session";
import PookalamRing from "../components/PookalamRing";
import Footer from "../components/Footer";

const OTHER = "__other__";

function isFullName(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2;
}

export default function LoginPage() {
  const router = useRouter();
  const [nameChoice, setNameChoice] = useState("");
  const [customName, setCustomName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getSession()) router.replace("/dashboard");
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!nameChoice) {
      setError("Select your name from the list.");
      return;
    }

    const name = (nameChoice === OTHER ? customName : nameChoice).trim();
    if (!name || name.length > 40) {
      setError("Enter your name (under 40 characters).");
      return;
    }
    if (nameChoice === OTHER && !isFullName(name)) {
      setError("Enter your full name (first and last).");
      return;
    }
    if (!pin.trim()) {
      setError("Enter the event PIN.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError("That name or PIN didn't match. Please try again.");
        return;
      }
      setSession({ name: data.name });
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
          {COMPANY_NAME}'s Onam + 14th-anniversary celebration. Pick your
          name and enter the event PIN to join.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Your name</label>
            <select
              id="name"
              value={nameChoice}
              onChange={(e) => setNameChoice(e.target.value)}
            >
              <option value="" disabled>
                Select your name…
              </option>
              {PLAYERS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value={OTHER}>Other (not listed)</option>
            </select>
          </div>

          {nameChoice === OTHER && (
            <div className="field">
              <label htmlFor="customName">Type your full name</label>
              <input
                id="customName"
                type="text"
                value={customName}
                maxLength={40}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Anjali Menon"
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="pin">Event PIN</label>
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
