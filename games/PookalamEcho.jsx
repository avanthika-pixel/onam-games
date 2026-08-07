"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PAD_COLORS = ["#c99a2e", "#7a1f2b", "#1f5c3d", "#e8a93b", "#2b4a7a"];
const MAX_ROUNDS = 20;
const LIT_MS = 480;
const GAP_MS = 220;
const TAP_FLASH_MS = 200;
const NEXT_ROUND_DELAY_MS = 2000;

function randomSequence(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * PAD_COLORS.length));
}

export default function PookalamEcho({ onFinish }) {
  const [phase, setPhase] = useState("ready");
  const [subPhase, setSubPhase] = useState("showing"); // "showing" | "waiting" | "pause"
  const [round, setRound] = useState(1);
  const [correctTaps, setCorrectTaps] = useState(0);
  const [activePad, setActivePad] = useState(null);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  const sequenceRef = useRef([]);
  const inputIndexRef = useRef(0);
  const correctTapsRef = useRef(0);
  const cancelRef = useRef(false);

  const finish = useCallback((didWin) => {
    setWon(didWin);
    setScore(correctTapsRef.current * 5);
    setPhase("done");
  }, []);

  const start = useCallback(() => {
    cancelRef.current = false;
    sequenceRef.current = randomSequence(1);
    inputIndexRef.current = 0;
    correctTapsRef.current = 0;
    setCorrectTaps(0);
    setRound(1);
    setScore(0);
    setWon(false);
    setSubPhase("showing");
    setPhase("playing");
  }, []);

  function playSequence(seq, onDone) {
    let i = 0;
    function step() {
      if (cancelRef.current) return;
      if (i >= seq.length) {
        setActivePad(null);
        onDone();
        return;
      }
      setActivePad(seq[i]);
      setTimeout(() => {
        if (cancelRef.current) return;
        setActivePad(null);
        setTimeout(() => {
          i += 1;
          step();
        }, GAP_MS);
      }, LIT_MS);
    }
    step();
  }

  useEffect(() => {
    if (phase !== "playing" || subPhase !== "showing") return;
    cancelRef.current = false;
    playSequence(sequenceRef.current, () => setSubPhase("waiting"));
    return () => {
      cancelRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, subPhase, round]);

  // Breathing room after a correct round before the next sequence starts.
  useEffect(() => {
    if (phase !== "playing" || subPhase !== "pause") return;
    const t = setTimeout(() => setSubPhase("showing"), NEXT_ROUND_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase, subPhase]);

  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  function pressPad(i) {
    if (phase !== "playing" || subPhase !== "waiting") return;
    setActivePad(i);
    setTimeout(() => setActivePad(null), TAP_FLASH_MS);

    const seq = sequenceRef.current;
    if (i === seq[inputIndexRef.current]) {
      inputIndexRef.current += 1;
      correctTapsRef.current += 1;
      setCorrectTaps(correctTapsRef.current);

      if (inputIndexRef.current === seq.length) {
        if (seq.length >= MAX_ROUNDS) {
          finish(true);
          return;
        }
        // Each round is a brand new random order, not the previous
        // sequence with one more tacked on — round N is always a fresh
        // shuffle of N taps, independent of round N-1.
        const nextSeq = randomSequence(seq.length + 1);
        sequenceRef.current = nextSeq;
        inputIndexRef.current = 0;
        setRound(nextSeq.length);
        setSubPhase("pause");
      }
    } else {
      finish(false);
    }
  }

  const size = 300;
  const center = size / 2;
  const radius = 105;

  return (
    <div className="game-screen">
      <div className="game-hud">
        <span>Pookalam Echo</span>
        <span>{phase === "playing" ? `Round: ${round}` : ""}</span>
      </div>

      {phase === "playing" && (
        <div
          className={`echo-status ${
            subPhase === "waiting" ? "echo-status-turn" : "echo-status-watch"
          }`}
        >
          {subPhase === "showing" && "👀 Watch the sequence…"}
          {subPhase === "waiting" && "👆 Your turn — repeat it back"}
          {subPhase === "pause" && "✅ Nice! Get ready for the next one…"}
        </div>
      )}

      {phase === "ready" && (
        <div className="game-overlay">
          <h2>Pookalam Echo</h2>
          <p>
            The pookalam rings light up in a sequence — watch closely, then
            tap the rings back in the same order. Get it right and the
            sequence grows by one; get it wrong and the round ends. How long
            a sequence can you hold in memory?
          </p>
          <button className="btn btn-primary" onClick={start}>
            Start
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div
          className="game-canvas-wrap"
          style={{
            "--game-w": `${size}px`,
            "--game-ratio": 1,
            opacity: subPhase === "pause" ? 0.55 : 1,
            pointerEvents: subPhase === "waiting" ? "auto" : "none",
            transition: "opacity 0.2s ease",
          }}
        >
          <svg viewBox={`0 0 ${size} ${size}`}>
            <circle cx={center} cy={center} r={20} fill="#e8a93b" />
            {PAD_COLORS.map((color, i) => {
              const angle = -Math.PI / 2 + i * ((2 * Math.PI) / PAD_COLORS.length);
              const x = center + radius * Math.cos(angle);
              const y = center + radius * Math.sin(angle);
              const lit = activePad === i;
              return (
                <g key={i}>
                  {lit && <circle cx={x} cy={y} r={40} fill={color} opacity={0.35} />}
                  <circle
                    cx={x}
                    cy={y}
                    r={32}
                    fill={color}
                    opacity={lit ? 1 : 0.55}
                    stroke={lit ? "#fffaf0" : "transparent"}
                    strokeWidth={4}
                    onClick={() => pressPad(i)}
                    style={{ cursor: subPhase === "waiting" ? "pointer" : "default" }}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {phase === "done" && (
        <div className="game-overlay">
          <h2>{won ? "Full sequence mastered!" : "Sequence broken!"}</h2>
          <p>
            Reached round {round} · Score: {score}
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
