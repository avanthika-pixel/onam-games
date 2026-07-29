"use client";

import { useEffect, useState, useCallback } from "react";

const COLORS = ["#c99a2e", "#7a1f2b", "#1f5c3d", "#e8a93b", "#2b4a7a"];
const RINGS = [6, 10, 14]; // petals per ring, outer to inner-ish
const ROUND_TIME = 30; // seconds

function buildTarget() {
  const petals = [];
  let id = 0;
  RINGS.forEach((count, ringIdx) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 60 + ringIdx * 45;
      petals.push({
        id: id++,
        ring: ringIdx,
        angle,
        radius,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
  });
  return petals;
}

export default function Pookalam({ onFinish }) {
  const [phase, setPhase] = useState("ready");
  const [target, setTarget] = useState([]);
  const [filled, setFilled] = useState({});
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [score, setScore] = useState(0);

  const start = useCallback(() => {
    setTarget(buildTarget());
    setFilled({});
    setSelectedColor(COLORS[0]);
    setTimeLeft(ROUND_TIME);
    setScore(0);
    setPhase("playing");
  }, []);

  const finish = useCallback(() => {
    setTarget((t) => {
      let correct = 0;
      t.forEach((p) => {
        if (filled[p.id] === p.color) correct += 1;
      });
      const timeBonus = Math.round(timeLeft * 0.5);
      const finalScore = correct * 10 + timeBonus;
      setScore(finalScore);
      setPhase("done");
      return t;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filled, timeLeft]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, finish]);

  useEffect(() => {
    if (phase !== "playing") return;
    const allFilled =
      target.length > 0 && target.every((p) => filled[p.id] !== undefined);
    if (allFilled) finish();
  }, [filled, target, phase, finish]);

  function placePetal(id) {
    setFilled((f) => ({ ...f, [id]: selectedColor }));
  }

  const size = 380;
  const center = size / 2;

  return (
    <div className="game-screen">
      <div className="game-hud">
        <span>Pookalam Rush</span>
        <span>{phase === "playing" ? `Time: ${timeLeft}s` : ""}</span>
      </div>

      {phase === "ready" && (
        <div className="game-overlay">
          <h2>Pookalam Rush</h2>
          <p>
            Match every petal to the color shown in the faded target pattern
            behind it. Pick a color, then tap a petal to fill it. Fill them
            all before the time runs out.
          </p>
          <button className="btn btn-primary" onClick={start}>
            Start
          </button>
        </div>
      )}

      {phase === "playing" && (
        <>
          <div className="game-canvas-wrap" style={{ "--game-w": `${size}px`, "--game-ratio": 1 }}>
            <svg viewBox={`0 0 ${size} ${size}`}>
              <circle cx={center} cy={center} r={18} fill="#e8a93b" />
              {target.map((p) => {
                const x = center + p.radius * Math.cos(p.angle);
                const y = center + p.radius * Math.sin(p.angle);
                const isFilled = filled[p.id] !== undefined;
                return (
                  <g key={p.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={16}
                      fill={isFilled ? filled[p.id] : "#f3e6c8"}
                      stroke={p.color}
                      strokeWidth={isFilled ? 0 : 3}
                      strokeOpacity={0.5}
                      onClick={() => placePetal(p.id)}
                      style={{ cursor: "pointer" }}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="color-palette">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`color-swatch ${selectedColor === c ? "selected" : ""}`}
                onClick={() => setSelectedColor(c)}
                style={{ background: c }}
              />
            ))}
          </div>
        </>
      )}

      {phase === "done" && (
        <div className="game-overlay">
          <h2>Pattern complete!</h2>
          <p>Score: {score}</p>
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
