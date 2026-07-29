"use client";

import { useEffect, useRef, useState } from "react";

const W = 380;
const H = 520;
const LANES = 3;
const LANE_W = W / LANES;
const BOAT_H = 46;
const GAME_LEN_MS = 30000;

export default function BoatRace({ onFinish }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState("ready"); // ready | playing | done
  const [finalScore, setFinalScore] = useState(0);
  const stateRef = useRef(null);

  function resetState() {
    stateRef.current = {
      lane: 1,
      targetLane: 1,
      obstacles: [],
      spawnTimer: 0,
      speed: 3.2,
      elapsed: 0,
      score: 0,
      alive: true,
    };
  }

  function start() {
    resetState();
    setPhase("playing");
  }

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let last = performance.now();

    function loop(now) {
      const dt = Math.min(now - last, 40);
      last = now;
      const s = stateRef.current;
      if (s.alive) {
        s.elapsed += dt;
        s.score = Math.floor(s.elapsed / 100);
        s.speed = 3.2 + s.elapsed / 6000;

        s.lane += (s.targetLane - s.lane) * 0.25;

        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0) {
          const lane = Math.floor(Math.random() * LANES);
          s.obstacles.push({ lane, y: -40 });
          s.spawnTimer = Math.max(650 - s.elapsed / 60, 280);
        }

        s.obstacles.forEach((o) => (o.y += s.speed * (dt / 16)));
        s.obstacles = s.obstacles.filter((o) => o.y < H + 40);

        const boatLane = Math.round(s.lane);
        const boatY = H - 90;
        s.obstacles.forEach((o) => {
          if (o.lane === boatLane && o.y > boatY - 30 && o.y < boatY + BOAT_H) {
            s.alive = false;
          }
        });

        if (s.elapsed >= GAME_LEN_MS) {
          s.alive = false;
          s.won = true;
        }

        if (!s.alive) {
          setFinalScore(s.score);
          setPhase("done");
        }
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#dcefe6";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < LANES - 1; i++) {
        ctx.strokeStyle = "#b7d9c9";
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo((i + 1) * LANE_W, 0);
        ctx.lineTo((i + 1) * LANE_W, H);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      s.obstacles.forEach((o) => {
        const cx = o.lane * LANE_W + LANE_W / 2;
        ctx.fillStyle = "#7a1f2b";
        ctx.beginPath();
        ctx.ellipse(cx, o.y, 26, 18, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      const boatX = s.lane * LANE_W + LANE_W / 2;
      const boatY = H - 90;
      ctx.fillStyle = "#c99a2e";
      ctx.beginPath();
      ctx.moveTo(boatX - 30, boatY);
      ctx.quadraticCurveTo(boatX, boatY + 34, boatX + 30, boatY);
      ctx.quadraticCurveTo(boatX, boatY - 10, boatX - 30, boatY);
      ctx.fill();
      ctx.fillStyle = "#1f5c3d";
      ctx.fillRect(boatX - 4, boatY - 22, 8, 22);

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  function moveLane(dir) {
    const s = stateRef.current;
    if (!s) return;
    s.targetLane = Math.max(0, Math.min(LANES - 1, s.targetLane + dir));
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft") moveLane(-1);
      if (e.key === "ArrowRight") moveLane(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="game-screen">
      <div className="game-hud">
        <span>Vallam Kali Dash</span>
        <span>{phase === "playing" ? `Score: ${stateRef.current?.score || 0}` : ""}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onClick={(e) => {
          const rect = e.target.getBoundingClientRect();
          const x = e.clientX - rect.left;
          moveLane(x < rect.width / 2 ? -1 : 1);
        }}
      />
      {phase === "ready" && (
        <div className="game-overlay">
          <h2>Vallam Kali Dash</h2>
          <p>
            Tap left/right side of the boat lane (or arrow keys) to steer
            between lanes and dodge the rocks. Survive 30 seconds for max
            score.
          </p>
          <button className="btn btn-primary" onClick={start}>
            Start
          </button>
        </div>
      )}
      {phase === "done" && (
        <div className="game-overlay">
          <h2>{stateRef.current?.won ? "You made it!" : "Boat capsized!"}</h2>
          <p>Score: {finalScore}</p>
          <button className="btn btn-primary" onClick={start} style={{ marginRight: 10 }}>
            Play again
          </button>
          <button className="btn" onClick={() => onFinish(finalScore)}>
            Submit score
          </button>
        </div>
      )}
    </div>
  );
}
