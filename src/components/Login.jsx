import { useState } from "react";
import { loginWithGoogle } from "../firebase";
import { COMPANY_DOMAIN } from "../config";
import PookalamRing from "./PookalamRing";

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      setError(e.message || "Something went wrong signing in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <PookalamRing size={56} />
        </div>
        <span className="eyebrow">Onam · 14th Anniversary</span>
        <h1>Team Score Arena</h1>
        <p className="sub">
          Sign in with your @{COMPANY_DOMAIN} account, pick your team, and start
          playing.
        </p>
        <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in…" : "Sign in with Google"}
        </button>
        {error && <div className="error-box">{error}</div>}
      </div>
    </div>
  );
}
