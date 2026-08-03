"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ITEMS = [
  { id: "rice", label: "Rice", emoji: "🍚" },
  { id: "payasam", label: "Payasam", emoji: "🍮" },
  { id: "pickle", label: "Pickle", emoji: "🥭" },
  { id: "banana", label: "Banana chips", emoji: "🍌" },
  { id: "curry", label: "Curry", emoji: "🍛" },
  { id: "papadam", label: "Papadam", emoji: "🫓" },
  { id: "sambar", label: "Sambar", emoji: "🍲" },
  { id: "thoran", label: "Thoran", emoji: "🥬" },
  { id: "olan", label: "Olan", emoji: "🎃" },
];

const ROUND_TIME = 90;
const WRONG_PENALTY = 4;
const MATCH_DELAY_MS = 450;
const MISMATCH_DELAY_MS = 800;

function buildDeck() {
  const deck = ITEMS.flatMap((item) => [
    { uid: `${item.id}-a`, itemId: item.id, emoji: item.emoji, label: item.label },
    { uid: `${item.id}-b`, itemId: item.id, emoji: item.emoji, label: item.label },
  ]);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export default function SadyaSort({ onFinish }) {
  const [phase, setPhase] = useState("ready");
  const [deck, setDeck] = useState([]);
  const [matchedIds, setMatchedIds] = useState({}); // itemId -> true once its pair is found
  const [flipped, setFlipped] = useState([]); // up to 2 tile uids
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const wrongRef = useRef(0);

  const start = useCallback(() => {
    setDeck(buildDeck());
    setMatchedIds({});
    setFlipped([]);
    setLocked(false);
    setTimeLeft(ROUND_TIME);
    setWrongAttempts(0);
    wrongRef.current = 0;
    setScore(0);
    setPhase("playing");
  }, []);

  const finish = useCallback((matchedCount, timeLeftAtEnd) => {
    const timeBonus = Math.round(timeLeftAtEnd * 0.5);
    const finalScore = Math.max(0, matchedCount * 15 + timeBonus - wrongRef.current * WRONG_PENALTY);
    setScore(finalScore);
    setPhase("done");
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      finish(Object.keys(matchedIds).length, 0);
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, matchedIds, finish]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (Object.keys(matchedIds).length === ITEMS.length) {
      finish(ITEMS.length, timeLeft);
    }
  }, [matchedIds, phase, timeLeft, finish]);

  function flipTile(tile) {
    if (locked || matchedIds[tile.itemId] || flipped.includes(tile.uid)) return;

    const next = [...flipped, tile.uid];
    setFlipped(next);
    if (next.length < 2) return;

    setLocked(true);
    const [a, b] = next.map((uid) => deck.find((d) => d.uid === uid));
    if (a.itemId === b.itemId) {
      setTimeout(() => {
        setMatchedIds((m) => ({ ...m, [a.itemId]: true }));
        setFlipped([]);
        setLocked(false);
      }, MATCH_DELAY_MS);
    } else {
      wrongRef.current += 1;
      setWrongAttempts(wrongRef.current);
      setTimeout(() => {
        setFlipped([]);
        setLocked(false);
      }, MISMATCH_DELAY_MS);
    }
  }

  const matchedCount = Object.keys(matchedIds).length;
  const stillHidden = ITEMS.filter((item) => !matchedIds[item.id]);

  return (
    <div className="game-screen">
      <div className="game-hud">
        <span>Sadya Sort</span>
        <span>
          {phase === "playing" &&
            `Time: ${timeLeft}s · Pairs: ${matchedCount}/${ITEMS.length} · Wrong: ${wrongAttempts}`}
        </span>
      </div>

      {phase === "ready" && (
        <div className="game-overlay">
          <h2>Sadya Sort</h2>
          <p>
            A classic memory match — {ITEMS.length} dish pairs, {deck.length || ITEMS.length * 2}{" "}
            face-down tiles. Flip two at a time; matching pairs stay revealed,
            mismatches flip back. Find every pair before time runs out. Each
            wrong flip costs {WRONG_PENALTY} points.
          </p>
          <button className="btn btn-primary" onClick={start}>
            Start
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="memory-board">
          {deck.map((tile) => {
            const faceUp = matchedIds[tile.itemId] || flipped.includes(tile.uid);
            return (
              <button
                key={tile.uid}
                type="button"
                className={`memory-tile ${faceUp ? "flipped" : ""} ${
                  matchedIds[tile.itemId] ? "matched" : ""
                }`}
                onClick={() => flipTile(tile)}
              >
                {faceUp ? tile.emoji : "🌿"}
              </button>
            );
          })}
        </div>
      )}

      {phase === "done" && (
        <div className="game-overlay">
          <h2>{matchedCount === ITEMS.length ? "Full sadya matched!" : "Time's up!"}</h2>
          <p>Score: {score}</p>

          <div className="sadya-review">
            <p className="sadya-review-summary">
              {matchedCount}/{ITEMS.length} pairs found · {wrongAttempts} wrong{" "}
              {wrongAttempts === 1 ? "flip" : "flips"}
            </p>
            {stillHidden.length > 0 && (
              <>
                <p className="sadya-review-label">Never matched:</p>
                <div className="sadya-review-chips">
                  {stillHidden.map((item) => (
                    <span className="sadya-review-chip" key={item.id}>
                      {item.emoji} {item.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

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
