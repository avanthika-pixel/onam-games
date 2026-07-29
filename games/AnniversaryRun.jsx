"use client";

import { useEffect, useRef, useState } from "react";

const W = 420;
const H = 320;
const GROUND_Y = H - 50;
const GOAL_CANDLES = 14;

export default function AnniversaryRun({ onFinish }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState("ready");
  const [finalScore, setFinalScore] = useState(0);
  const stateRef = useRef(null);

  function resetState() {
    stateRef.current = {
      y: GROUND_Y,
      vy: 0,
      jumping: false,
      obstacles: [],
      candles: [],
      spawnTimer: 0,
      candleTimer: 800,
      speed: 4,
      distance: 0,
      collected: 0,
      alive: true,
    };
  }

  function start() {
    resetState();
    setPhase("playing");
  }

  function jump() {
    const s = stateRef.current;
    if (s && !s.jumping) {
      s.jumping = true;
      s.vy = -11;
    }
  }

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;

    function loop() {
      const s = stateRef.current;
      if (s.alive) {
        s.distance += s.speed;
        s.speed = 4 + s.distance / 2000;

        s.vy += 0.6;
        s.y += s.vy;
        if (s.y > GROUND_Y) {
          s.y = GROUND_Y;
          s.vy = 0;
          s.jumping = false;
        }

        s.spawnTimer -= 16;
        if (s.spawnTimer <= 0) {
          s.obstacles.push({ x: W + 20 });
          s.spawnTimer = Math.max(1100 - s.distance / 8, 550);
        }
        s.obstacles.forEach((o) => (o.x -= s.speed));
        s.obstacles = s.obstacles.filter((o) => o.x > -30);

        s.candleTimer -= 16;
        if (s.candleTimer <= 0 && s.collected < GOAL_CANDLES) {
          s.candles.push({ x: W + 20, y: GROUND_Y - 60 - Math.random() * 40 });
          s.candleTimer = 700;
        }
        s.candles.forEach((c) => (c.x -= s.speed));
        s.candles = s.candles.filter((c) => c.x > -30);

        const runnerX = 60;
        s.obstacles.forEach((o) => {
          if (Math.abs(o.x - runnerX) < 22 && s.y > GROUND_Y - 30) {
            s.alive = false;
          }
        });

        s.candles = s.candles.filter((c) => {
          const hit = Math.abs(c.x - runnerX) < 24 && Math.abs(c.y - s.y + 20) < 30;
          if (hit) s.collected += 1;
          return !hit;
        });

        if (s.collected >= GOAL_CANDLES) {
          s.alive = false;
          s.won = true;
        }

        if (!s.alive) {
          const score = s.collected * 10 + Math.floor(s.distance / 20);
          setFinalScore(score);
          setPhase("done");
        }
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#fbf3e1";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#c99a2e";
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + 20);
      ctx.lineTo(W, GROUND_Y + 20);
      ctx.stroke();

      ctx.fillStyle = "#7a1f2b";
      ctx.fillRect(48, s.y - 40, 24, 40);

      ctx.fillStyle = "#1f5c3d";
      s.obstacles.forEach((o) => {
        ctx.fillRect(o.x - 10, GROUND_Y - 30, 20, 30);
      });

      s.candles.forEach((c) => {
        ctx.fillStyle = "#e8a93b";
        ctx.fillRect(c.x - 3, c.y, 6, 20);
        ctx.fillStyle = "#c99a2e";
        ctx.beginPath();
        ctx.arc(c.x, c.y - 4, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    function onKey(e) {
      if (e.code === "Space" || e.key === "ArrowUp") jump();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="game-screen">
      <div className="game-hud">
        <span>14 Candles</span>
        <span>
          {phase === "playing"
            ? `Candles: ${stateRef.current?.collected || 0}/${GOAL_CANDLES}`
            : ""}
        </span>
      </div>
      <canvas ref={canvasRef} width={W} height={H} onClick={jump} />
      {phase === "ready" && (
        <div className="game-overlay">
          <h2>14 Candles</h2>
          <p>
            Tap the canvas, press space, or hit the up arrow to jump.
            Collect all 14 candles — one for every year — while dodging
            obstacles.
          </p>
          <button className="btn btn-primary" onClick={start}>
            Start
          </button>
        </div>
      )}
      {phase === "done" && (
        <div className="game-overlay">
          <h2>{stateRef.current?.won ? "All 14 candles lit!" : "Tripped up!"}</h2>
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
