"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const COLORS = ["#c99a2e", "#7a1f2b", "#1f5c3d", "#e8a93b", "#2b4a7a"];
const RINGS = [6, 10, 14]; // petals per ring, outer to inner-ish
const ROUND_TIME = 30; // seconds
const MEMORIZE_TIME = 6; // seconds
const WRONG_PENALTY = 3;

function shuffled(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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
  const [subPhase, setSubPhase] = useState("memorize"); // "memorize" | "fill"
  const [target, setTarget] = useState([]);
  const [filled, setFilled] = useState({});
  const [paletteOrder, setPaletteOrder] = useState(COLORS);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [memorizeLeft, setMemorizeLeft] = useState(MEMORIZE_TIME);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [misses, setMisses] = useState(0);
  const [score, setScore] = useState(0);
  const missesRef = useRef(0);

  const start = useCallback(() => {
    const t = buildTarget();
    const palette = shuffled(COLORS);
    setTarget(t);
    setFilled({});
    setPaletteOrder(palette);
    setSelectedColor(palette[0]);
    setMemorizeLeft(MEMORIZE_TIME);
    setTimeLeft(ROUND_TIME);
    setMisses(0);
    missesRef.current = 0;
    setSubPhase("memorize");
    setPhase("playing");
  }, []);

  const finish = useCallback(() => {
    setTarget((t) => {
      let correct = 0;
      t.forEach((p) => {
        if (filled[p.id] === p.color) correct += 1;
      });
      const timeBonus = Math.round(timeLeft * 0.5);
      const finalScore = Math.max(0, correct * 10 + timeBonus - missesRef.current * WRONG_PENALTY);
      setScore(finalScore);
      setPhase("done");
      return t;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filled, timeLeft]);

  // Memorize countdown — the full pattern is shown, nothing is tappable yet.
  useEffect(() => {
    if (phase !== "playing" || subPhase !== "memorize") return;
    if (memorizeLeft <= 0) {
      setSubPhase("fill");
      return;
    }
    const t = setTimeout(() => setMemorizeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, subPhase, memorizeLeft]);

  useEffect(() => {
    if (phase !== "playing" || subPhase !== "fill") return;
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, subPhase, timeLeft, finish]);

  useEffect(() => {
    if (phase !== "playing" || subPhase !== "fill") return;
    const allFilled =
      target.length > 0 && target.every((p) => filled[p.id] !== undefined);
    if (allFilled) finish();
  }, [filled, target, phase, subPhase, finish]);

  function placePetal(id, color) {
    if (color !== target.find((p) => p.id === id)?.color) {
      missesRef.current += 1;
      setMisses(missesRef.current);
    }
    setFilled((f) => ({ ...f, [id]: color }));
  }

  const size = 380;
  const center = size / 2;
  const memorizing = subPhase === "memorize";

  return (
    <div className="game-screen">
      <div className="game-hud">
        <span>Pookalam Rush</span>
        <span>
          {phase === "playing" && memorizing && `Memorize: ${memorizeLeft}s`}
          {phase === "playing" && !memorizing && `Time: ${timeLeft}s · Misses: ${misses}`}
        </span>
      </div>

      {phase === "ready" && (
        <div className="game-overlay">
          <h2>Pookalam Rush</h2>
          <p>
            The full pattern is revealed for {MEMORIZE_TIME} seconds — memorize
            which color goes where. Then it goes blank and you rebuild it from
            memory: pick a color, tap a petal to fill it. Wrong guesses cost
            you {WRONG_PENALTY} points each.
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
                const displayColor = memorizing ? p.color : isFilled ? filled[p.id] : "#f3e6c8";
                return (
                  <circle
                    key={p.id}
                    cx={x}
                    cy={y}
                    r={16}
                    fill={displayColor}
                    stroke="#d8c9a3"
                    strokeWidth={memorizing || isFilled ? 0 : 2}
                    onClick={() => !memorizing && placePetal(p.id, selectedColor)}
                    style={{ cursor: memorizing ? "default" : "pointer" }}
                  />
                );
              })}
            </svg>
          </div>
          {!memorizing && (
            <div className="color-palette">
              {paletteOrder.map((c) => (
                <button
                  key={c}
                  className={`color-swatch ${selectedColor === c ? "selected" : ""}`}
                  onClick={() => setSelectedColor(c)}
                  style={{ background: c }}
                />
              ))}
            </div>
          )}
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
