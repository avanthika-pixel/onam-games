"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const POWERUPS = [
  { id: "controller", label: "Controller", emoji: "🎮" },
  { id: "trophy", label: "Trophy", emoji: "🏆" },
  { id: "boost", label: "Boost", emoji: "⚡" },
  { id: "headset", label: "Headset", emoji: "🎧" },
  { id: "gem", label: "Gem", emoji: "💎" },
  { id: "combo", label: "Combo", emoji: "🔥" },
];

const GLITCHES = [
  { id: "bug", label: "Bug", emoji: "🐛" },
  { id: "crash", label: "Crash", emoji: "💥" },
  { id: "lag", label: "Lag", emoji: "⏳" },
  { id: "disconnect", label: "Disconnect", emoji: "🔌" },
  { id: "freeze", label: "Freeze", emoji: "🧟" },
  { id: "framedrop", label: "Frame drop", emoji: "📉" },
];

const ROUND_TIME = 45;
const SWIPE_THRESHOLD = 90;
const SWIPE_COOLDOWN_MS = 380;
const WRONG_PENALTY = 10;

function randomCard() {
  const good = Math.random() < 0.5;
  const pool = good ? POWERUPS : GLITCHES;
  const item = pool[Math.floor(Math.random() * pool.length)];
  return { ...item, good, key: `${item.id}-${Math.random()}` };
}

export default function LootSwipe({ onFinish }) {
  const [phase, setPhase] = useState("ready");
  const [card, setCard] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [flash, setFlash] = useState(null); // "correct" | "wrong"

  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const lastSwipeRef = useRef(0);

  const start = useCallback(() => {
    setCard(randomCard());
    setDragX(0);
    setTimeLeft(ROUND_TIME);
    setScore(0);
    setStreak(0);
    setFlash(null);
    setPhase("playing");
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      setPhase("done");
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  function resolveSwipe(direction) {
    if (phase !== "playing") return;

    // Blocks the "hold the arrow key / spam-click" exploit: a real swipe
    // gesture can't happen faster than this, so without it a held key's
    // auto-repeat could rack up a swipe every few ms regardless of whether
    // the card was ever actually read.
    const now = performance.now();
    if (now - lastSwipeRef.current < SWIPE_COOLDOWN_MS) return;
    lastSwipeRef.current = now;

    const swipeRight = direction > 0;
    const correct = swipeRight === card.good;
    setFlash(correct ? "correct" : "wrong");
    setScore((s) => Math.max(0, correct ? s + 10 + Math.min(streak, 10) * 2 : s - WRONG_PENALTY));
    setStreak((s) => (correct ? s + 1 : 0));
    setDragX(0);
    setTimeout(() => {
      setFlash(null);
      setCard(randomCard());
    }, 150);
  }

  function onPointerDown(e) {
    draggingRef.current = true;
    startXRef.current = e.clientX;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function onPointerMove(e) {
    if (!draggingRef.current) return;
    setDragX(e.clientX - startXRef.current);
  }

  function onPointerUp(e) {
    draggingRef.current = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      resolveSwipe(delta);
    } else {
      setDragX(0);
    }
  }

  useEffect(() => {
    function onKey(e) {
      if (phase !== "playing" || !card) return;
      if (e.repeat) return; // ignore auto-repeat from a held-down key
      if (e.key === "ArrowLeft") resolveSwipe(-SWIPE_THRESHOLD - 1);
      if (e.key === "ArrowRight") resolveSwipe(SWIPE_THRESHOLD + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, card, streak]);

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = Math.max(-18, Math.min(18, dragX / 8));

  return (
    <div className="game-screen">
      <div className="game-hud">
        <span>Loot Swipe</span>
        <span>{phase === "playing" ? `Time: ${timeLeft}s · Score: ${score}` : ""}</span>
      </div>

      {phase === "ready" && (
        <div className="game-overlay">
          <h2>Loot Swipe</h2>
          <p>
            Swipe right to keep a power-up, swipe left to reject a glitch.
            Arrow keys work too. Correct swipes build a streak for bonus
            points — wrong ones cost you points and reset your streak, so
            guessing blindly won't get you far. 45 seconds on the clock.
          </p>
          <button className="btn btn-primary" onClick={start}>
            Start
          </button>
        </div>
      )}

      {phase === "playing" && card && (
        <div className="loot-arena">
          <div className="loot-hint loot-hint-left">← Glitch</div>
          <div
            className={`loot-card ${flash ? `loot-flash-${flash}` : ""}`}
            style={{ transform: `translateX(${dragX}px) rotate(${rotate}deg)` }}
            onPointerDown={onPointerDown}
          >
            <div className="loot-card-emoji">{card.emoji}</div>
            <div className="loot-card-label">{card.label}</div>
          </div>
          <div className="loot-hint loot-hint-right">Power-up →</div>
        </div>
      )}

      {phase === "done" && (
        <div className="game-overlay">
          <h2>Round over!</h2>
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
