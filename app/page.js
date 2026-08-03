"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COMPANY_NAME, EVENT_NAME } from "../lib/config";
import { getSession, setSession } from "../lib/session";
import PookalamRing from "../components/PookalamRing";
import Footer from "../components/Footer";

function isFullName(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2;
}

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
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
    if (!isFullName(trimmedName)) {
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
        body: JSON.stringify({ name: trimmedName, pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError("That name or PIN didn't match. Please try again.");
        return;
      }
      setSession({ name: trimmedName });
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
          full name and the event PIN to join.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Your full name</label>
            <input
              id="name"
              type="text"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anjali Menon"
            />
          </div>

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
