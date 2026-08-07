"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COMPANY_NAME, EVENT_NAME, PLAYERS } from "../lib/config";
import { getSession, setSession } from "../lib/session";
import Logo from "../components/Logo";
import Footer from "../components/Footer";

function isFullName(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2;
}

export default function LoginPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const comboRef = useRef(null);

  useEffect(() => {
    if (getSession()) router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    function onOutsideClick(e) {
      if (comboRef.current && !comboRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    document.addEventListener("touchstart", onOutsideClick);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
      document.removeEventListener("touchstart", onOutsideClick);
    };
  }, []);

  const filtered = PLAYERS.filter((n) => n.toLowerCase().includes(query.trim().toLowerCase()));

  function selectName(n) {
    setQuery(n);
    setOpen(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const name = query.trim();
    if (!name || name.length > 40) {
      setError("Enter your name (under 40 characters).");
      return;
    }
    if (!isFullName(name)) {
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
          <Logo size={56} />
        </div>
        <span className="eyebrow">{COMPANY_NAME.toUpperCase()}</span>
        <h1>{EVENT_NAME}</h1>
        <p className="sub">
          {COMPANY_NAME}'s Onam + 14th-anniversary celebration. Pick your
          name and enter the event PIN to join.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field name-combobox" ref={comboRef}>
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              type="text"
              autoComplete="off"
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              placeholder="Type or pick your name…"
            />
            {open && (
              <div className="name-dropdown">
                {filtered.map((n) => (
                  <button
                    type="button"
                    key={n}
                    className="name-option"
                    onMouseDown={() => selectName(n)}
                  >
                    {n}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="name-option-empty">
                    Not listed — just finish typing your full name.
                  </div>
                )}
              </div>
            )}
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
