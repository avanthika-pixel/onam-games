"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ITEMS = [
  { id: "rice", label: "Rice", emoji: "🍚" },
  { id: "payasam", label: "Payasam", emoji: "🍮" },
  { id: "pickle", label: "Pickle", emoji: "🥭" },
  { id: "banana", label: "Banana chips", emoji: "🍌" },
  { id: "curry", label: "Curry", emoji: "🍛" },
  { id: "papadam", label: "Papadam", emoji: "🫓" },
];

const ROUND_TIME = 60;
const MEMORIZE_TIME = 5;
const WRONG_PENALTY = 5;

function shuffled(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function SadyaSort({ onFinish }) {
  const [phase, setPhase] = useState("ready");
  const [subPhase, setSubPhase] = useState("memorize"); // "memorize" | "drag"
  const [slotTargets, setSlotTargets] = useState([]); // ITEMS shuffled into 6 slot positions
  const [trayOrder, setTrayOrder] = useState([]);
  const [placed, setPlaced] = useState({}); // { [itemId]: true } once correctly dropped
  const [memorizeLeft, setMemorizeLeft] = useState(MEMORIZE_TIME);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [misses, setMisses] = useState(0);
  const [score, setScore] = useState(0);
  const [dragging, setDragging] = useState(null); // { itemId, x, y }
  const [wrongSlotId, setWrongSlotId] = useState(null);

  const slotRefs = useRef({});
  const draggingRef = useRef(null);

  const start = useCallback(() => {
    setSlotTargets(shuffled(ITEMS));
    setTrayOrder(shuffled(ITEMS));
    setPlaced({});
    setMisses(0);
    setMemorizeLeft(MEMORIZE_TIME);
    setTimeLeft(ROUND_TIME);
    setScore(0);
    setSubPhase("memorize");
    setPhase("playing");
  }, []);

  const finish = useCallback((placedMap, timeLeftAtEnd, missCount) => {
    const correct = Object.keys(placedMap).length;
    const finalScore = Math.max(
      0,
      correct * 15 + Math.round(timeLeftAtEnd * 0.5) - missCount * WRONG_PENALTY
    );
    setScore(finalScore);
    setPhase("done");
  }, []);

  // Memorize countdown — the leaf is fully visible and nothing is
  // draggable yet, then the hints disappear and the real round starts.
  useEffect(() => {
    if (phase !== "playing" || subPhase !== "memorize") return;
    if (memorizeLeft <= 0) {
      setSubPhase("drag");
      return;
    }
    const t = setTimeout(() => setMemorizeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, subPhase, memorizeLeft]);

  useEffect(() => {
    if (phase !== "playing" || subPhase !== "drag") return;
    if (timeLeft <= 0) {
      finish(placed, 0, misses);
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, subPhase, timeLeft, placed, misses, finish]);

  useEffect(() => {
    if (phase !== "playing" || subPhase !== "drag") return;
    if (Object.keys(placed).length === ITEMS.length) {
      finish(placed, timeLeft, misses);
    }
  }, [placed, phase, subPhase, timeLeft, misses, finish]);

  function onPointerDown(e, itemId) {
    if (placed[itemId]) return;
    e.preventDefault();
    draggingRef.current = itemId;
    setDragging({ itemId, x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function onPointerMove(e) {
    if (!draggingRef.current) return;
    setDragging({ itemId: draggingRef.current, x: e.clientX, y: e.clientY });
  }

  function onPointerUp(e) {
    const itemId = draggingRef.current;
    draggingRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    setDragging(null);
    if (!itemId) return;

    for (const slot of slotTargets) {
      const el = slotRefs.current[slot.id];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const within =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!within) continue;

      if (slot.id === itemId) {
        setPlaced((p) => ({ ...p, [itemId]: true }));
      } else {
        setMisses((m) => m + 1);
        setWrongSlotId(slot.id);
        setTimeout(() => setWrongSlotId(null), 300);
      }
      return;
    }
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draggingItem = dragging ? ITEMS.find((i) => i.id === dragging.itemId) : null;
  const showHints = subPhase === "memorize";

  return (
    <div className="game-screen">
      <div className="game-hud">
        <span>Sadya Sort</span>
        <span>
          {phase === "playing" && subPhase === "memorize" && `Memorize: ${memorizeLeft}s`}
          {phase === "playing" && subPhase === "drag" && `Time: ${timeLeft}s · Misses: ${misses}`}
        </span>
      </div>

      {phase === "ready" && (
        <div className="game-overlay">
          <h2>Sadya Sort</h2>
          <p>
            The leaf shows all six dishes in place for {MEMORIZE_TIME} seconds —
            memorize where each one goes. Then the hints vanish and you drag
            each dish from the tray onto its correct spot from memory. Wrong
            guesses cost you {WRONG_PENALTY} points each, so guess carefully.
          </p>
          <button className="btn btn-primary" onClick={start}>
            Start
          </button>
        </div>
      )}

      {phase === "playing" && (
        <>
          <div className="sadya-board">
            {slotTargets.map((slot) => (
              <div
                key={slot.id}
                ref={(el) => (slotRefs.current[slot.id] = el)}
                className={`sadya-slot ${placed[slot.id] ? "filled" : ""} ${
                  wrongSlotId === slot.id ? "wrong" : ""
                }`}
              >
                <span
                  className="sadya-slot-emoji"
                  style={{ opacity: placed[slot.id] ? 1 : showHints ? 1 : 0 }}
                >
                  {slot.emoji}
                </span>
              </div>
            ))}
          </div>

          {subPhase === "drag" && (
            <div className="sadya-tray">
              {trayOrder
                .filter((item) => !placed[item.id])
                .map((item) => (
                  <button
                    key={item.id}
                    className="sadya-tray-item"
                    onPointerDown={(e) => onPointerDown(e, item.id)}
                  >
                    <span>{item.emoji}</span>
                    <small>{item.label}</small>
                  </button>
                ))}
            </div>
          )}

          {draggingItem && (
            <div
              className="sadya-drag-ghost"
              style={{ left: dragging.x, top: dragging.y }}
            >
              {draggingItem.emoji}
            </div>
          )}
        </>
      )}

      {phase === "done" && (
        <div className="game-overlay">
          <h2>{Object.keys(placed).length === ITEMS.length ? "Leaf complete!" : "Time's up!"}</h2>
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
