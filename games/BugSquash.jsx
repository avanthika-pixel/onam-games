"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GRID_SIZE = 12;
const ROUND_TIME = 40;
const BUG_POINTS = 10;
const POWERUP_PENALTY = 8;
const POWERUPS = ["🏆", "⚡", "🎮"];
const TICK_MS = 100;

export default function BugSquash({ onFinish }) {
  const [phase, setPhase] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [score, setScore] = useState(0);
  const [squashed, setSquashed] = useState(0);
  const [misses, setMisses] = useState(0);
  const [, setTick] = useState(0);

  const cellsRef = useRef(Array.from({ length: GRID_SIZE }, () => null));
  const elapsedRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const scoreRef = useRef(0);
  const squashedRef = useRef(0);
  const missesRef = useRef(0);

  const start = useCallback(() => {
    cellsRef.current = Array.from({ length: GRID_SIZE }, () => null);
    elapsedRef.current = 0;
    spawnTimerRef.current = 0;
    scoreRef.current = 0;
    squashedRef.current = 0;
    missesRef.current = 0;
    setScore(0);
    setSquashed(0);
    setMisses(0);
    setTimeLeft(ROUND_TIME);
    setPhase("playing");
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => {
      elapsedRef.current += TICK_MS;
      const now = elapsedRef.current;

      // Cells that have overstayed disappear untapped — no penalty, just a
      // missed chance.
      cellsRef.current = cellsRef.current.map((c) => (c && now >= c.expiresAt ? null : c));

      // Spawn rate and visible lifetime both get tougher over the round.
      spawnTimerRef.current -= TICK_MS;
      if (spawnTimerRef.current <= 0) {
        const emptyIdx = cellsRef.current
          .map((c, i) => (c ? -1 : i))
          .filter((i) => i >= 0);
        if (emptyIdx.length > 0) {
          const idx = emptyIdx[Math.floor(Math.random() * emptyIdx.length)];
          const isBug = Math.random() < 0.72;
          const lifetime = Math.max(1050 - now / 60, 550);
          cellsRef.current[idx] = {
            kind: isBug ? "bug" : "powerup",
            emoji: isBug ? "🐛" : POWERUPS[Math.floor(Math.random() * POWERUPS.length)],
            expiresAt: now + lifetime,
          };
        }
        const baseGap = Math.max(650 - now / 40, 300);
        spawnTimerRef.current = baseGap + (Math.random() - 0.5) * 200;
      }

      setTick((t) => t + 1);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      setScore(scoreRef.current);
      setPhase("done");
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  function tapCell(i) {
    const cell = cellsRef.current[i];
    if (!cell) return;
    cellsRef.current[i] = null;

    if (cell.kind === "bug") {
      scoreRef.current += BUG_POINTS;
      squashedRef.current += 1;
      setSquashed(squashedRef.current);
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - POWERUP_PENALTY);
      missesRef.current += 1;
      setMisses(missesRef.current);
    }
    setScore(scoreRef.current);
    setTick((t) => t + 1);
  }

  return (
    <div className="game-screen">
      <div className="game-hud">
        <span>Bug Squash</span>
        <span>
          {phase === "playing" && `Time: ${timeLeft}s · Score: ${score} · Squashed: ${squashed}`}
        </span>
      </div>

      {phase === "ready" && (
        <div className="game-overlay">
          <h2>Bug Squash</h2>
          <p>
            Bugs (🐛) pop up across the panel — tap them fast before they
            duck back down, +{BUG_POINTS} each. Power-ups (🏆⚡🎮) pop up too,
            but those are the good stuff — tapping one by mistake costs you{" "}
            {POWERUP_PENALTY} points. Squash smart, not just fast. {ROUND_TIME}{" "}
            seconds on the clock.
          </p>
          <button className="btn btn-primary" onClick={start}>
            Start
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="bugsquash-board">
          {cellsRef.current.map((cell, i) => (
            <button
              key={i}
              type="button"
              className={`bugsquash-cell ${cell ? `bugsquash-${cell.kind}` : ""}`}
              onClick={() => tapCell(i)}
            >
              {cell ? cell.emoji : ""}
            </button>
          ))}
        </div>
      )}

      {phase === "done" && (
        <div className="game-overlay">
          <h2>Round over!</h2>
          <p>
            Score: {score} · {squashed} bugs squashed · {misses} power-ups hit by mistake
          </p>
          <button className="btn btn-primary" onClick={start} style={{ marginRight: 10 }}>
            Play again
          </button>
          <button className="btn" onClick={() => onFinish(score)}>
            Submit score
          </button>
        </div>
      )}
    </div>
  );
}
