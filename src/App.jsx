import { useEffect, useState, useCallback } from "react";
import { watchAuth, getUserDoc, logout, submitScore } from "./firebase";
import Login from "./components/Login";
import TeamSelect from "./components/TeamSelect";
import Dashboard from "./components/Dashboard";
import Leaderboard from "./components/Leaderboard";
import PookalamRing from "./components/PookalamRing";
import BoatRace from "./games/BoatRace";
import Pookalam from "./games/Pookalam";
import AnniversaryRun from "./games/AnniversaryRun";
import { GAMES } from "./config";

export default function App() {
  const [authUser, setAuthUser] = useState(undefined); // undefined = loading, null = signed out
  const [userData, setUserData] = useState(null);
  const [view, setView] = useState("dashboard"); // dashboard | leaderboard | game:<id>

  useEffect(() => {
    return watchAuth(async (u) => {
      setAuthUser(u);
      if (u) {
        const data = await getUserDoc(u.uid);
        setUserData(data);
      } else {
        setUserData(null);
      }
    });
  }, []);

  const refreshUserData = useCallback(async () => {
    if (authUser) {
      const data = await getUserDoc(authUser.uid);
      setUserData(data);
    }
  }, [authUser]);

  async function handleScoreSubmit(gameId, score) {
    await submitScore({ uid: authUser.uid, gameId, score });
    await refreshUserData();
    setView("dashboard");
  }

  if (authUser === undefined) {
    return <div className="center-screen">Loading…</div>;
  }

  if (!authUser) {
    return <Login />;
  }

  if (!userData) {
    return <TeamSelect user={authUser} onJoined={refreshUserData} />;
  }

  const activeGame = view.startsWith("game:") ? view.split(":")[1] : null;

  return (
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          <PookalamRing size={28} />
          Team Score Arena
        </div>
        <div className="who">
          <span className="team-tag">{userData.displayId}</span>
          <button className="linklike" onClick={() => setView("dashboard")}>
            Games
          </button>
          <button className="linklike" onClick={() => setView("leaderboard")}>
            Leaderboard
          </button>
          <button className="linklike" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>

      <div className="content">
        {view === "dashboard" && (
          <Dashboard
            userData={userData}
            onPlay={(id) => setView(`game:${id}`)}
            onViewLeaderboard={() => setView("leaderboard")}
          />
        )}

        {view === "leaderboard" && <Leaderboard />}

        {activeGame === "boat" && (
          <BoatRace onFinish={(score) => handleScoreSubmit("boat", score)} />
        )}
        {activeGame === "pookalam" && (
          <Pookalam onFinish={(score) => handleScoreSubmit("pookalam", score)} />
        )}
        {activeGame === "anniversary" && (
          <AnniversaryRun
            onFinish={(score) => handleScoreSubmit("anniversary", score)}
          />
        )}
      </div>
    </div>
  );
}
