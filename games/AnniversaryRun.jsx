"use client";

import { useEffect, useRef, useState } from "react";

const W = 420;
const H = 320;
const GROUND_Y = H - 50;

export default function AnniversaryRun({ onFinish }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState("ready");
  const [finalScore, setFinalScore] = useState(0);
  const [liveCollected, setLiveCollected] = useState(0);
  const stateRef = useRef(null);
  const lastShownRef = useRef(0);

  function resetState() {
    // A fresh randomized "feel" every run: speed, ramp rate, and spawn
    // density all vary, so no two playthroughs are the same difficulty
    // curve, on top of individual obstacles/candles being randomized too.
    stateRef.current = {
      y: GROUND_Y,
      vy: 0,
      jumping: false,
      obstacles: [],
      candles: [],
      spawnTimer: 600,
      candleTimer: 500 + Math.random() * 400,
      baseSpeed: 3.6 + Math.random() * 0.8,
      speed: 0,
      rampDivisor: 1300 + Math.random() * 500,
      obstacleGapBase: 800 + Math.random() * 300,
      candleGapBase: 550 + Math.random() * 350,
      distance: 0,
      collected: 0,
      alive: true,
    };
    stateRef.current.speed = stateRef.current.baseSpeed;
    lastShownRef.current = 0;
    setLiveCollected(0);
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
        s.speed = s.baseSpeed + s.distance / s.rampDivisor;

        s.vy += 0.6;
        s.y += s.vy;
        if (s.y > GROUND_Y) {
          s.y = GROUND_Y;
          s.vy = 0;
          s.jumping = false;
        }

        s.spawnTimer -= 16;
        if (s.spawnTimer <= 0) {
          // Randomized size and gap so obstacles are never evenly spaced or
          // identical between — or within — runs.
          const w = 16 + Math.random() * 16; // 16-32
          const h = 22 + Math.random() * 24; // 22-46
          s.obstacles.push({ x: W + 20, w, h });
          const base = Math.max(s.obstacleGapBase - s.distance / 6, 400);
          const jitter = (Math.random() - 0.5) * 320;
          s.spawnTimer = Math.max(base + jitter, 380);
        }
        s.obstacles.forEach((o) => (o.x -= s.speed));
        s.obstacles = s.obstacles.filter((o) => o.x > -40);

        s.candleTimer -= 16;
        if (s.candleTimer <= 0) {
          // Candles never run out — this is an endless runner, not a
          // "collect 14 and stop" game. 14 is just the anniversary theme.
          s.candles.push({ x: W + 20, y: GROUND_Y - 40 - Math.random() * 90 });
          s.candleTimer = s.candleGapBase + (Math.random() - 0.5) * 300;
        }
        s.candles.forEach((c) => (c.x -= s.speed));
        s.candles = s.candles.filter((c) => c.x > -30);

        const runnerX = 60;
        s.obstacles.forEach((o) => {
          const halfW = o.w / 2 + 12;
          if (Math.abs(o.x - runnerX) < halfW && s.y > GROUND_Y - o.h) {
            s.alive = false;
          }
        });

        s.candles = s.candles.filter((c) => {
          const hit = Math.abs(c.x - runnerX) < 24 && Math.abs(c.y - s.y + 20) < 30;
          if (hit) s.collected += 1;
          return !hit;
        });

        if (s.collected !== lastShownRef.current) {
          lastShownRef.current = s.collected;
          setLiveCollected(s.collected);
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

      s.obstacles.forEach((o) => {
        ctx.fillStyle = "#1f5c3d";
        ctx.fillRect(o.x - o.w / 2, GROUND_Y - o.h, o.w, o.h);
        ctx.fillStyle = "#123a26";
        ctx.fillRect(o.x - o.w / 2, GROUND_Y - o.h, o.w, 4);
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
        <span>14 Years & Running</span>
        <span>{phase === "playing" ? `Candles: ${liveCollected}` : ""}</span>
      </div>
      <div className="game-canvas-wrap" style={{ "--game-w": `${W}px`, "--game-ratio": W / H }}>
        <canvas ref={canvasRef} width={W} height={H} onClick={jump} />
      </div>
      {phase === "ready" && (
        <div className="game-overlay">
          <h2>14 Years & Running</h2>
          <p>
            An endless runner — there's no finish line. Tap the canvas, press
            space, or hit the up arrow to jump over obstacles and keep
            collecting candles for as long as you can survive. Obstacles and
            candles are placed differently every run, and it only gets
            faster the further you go.
          </p>
          <button className="btn btn-primary" onClick={start}>
            Start
          </button>
        </div>
      )}
      {phase === "done" && (
        <div className="game-overlay">
          <h2>Tripped up!</h2>
          <p>
            {liveCollected} candles collected · Score: {finalScore}
          </p>
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
