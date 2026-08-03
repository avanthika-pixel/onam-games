"use client";

import { useEffect, useRef } from "react";

// Fixed, deterministic layout (no Math.random in render) so this never
// mismatches between server and client hydration. depth = how far it
// travels relative to the pointer; variant = which theme it represents.
const DOTS = [
  { top: "8%", left: "12%", size: 16, depth: 0.5, variant: "gold" },
  { top: "16%", left: "84%", size: 24, depth: 0.85, variant: "blue" },
  { top: "28%", left: "6%", size: 12, depth: 0.35, variant: "leaf" },
  { top: "42%", left: "93%", size: 18, depth: 0.65, variant: "maroon" },
  { top: "58%", left: "16%", size: 20, depth: 0.95, variant: "blue" },
  { top: "70%", left: "89%", size: 14, depth: 0.45, variant: "gold" },
  { top: "84%", left: "9%", size: 18, depth: 0.75, variant: "leaf" },
  { top: "12%", left: "50%", size: 10, depth: 0.3, variant: "maroon" },
  { top: "50%", left: "50%", size: 22, depth: 0.55, variant: "blue" },
  { top: "92%", left: "62%", size: 16, depth: 0.6, variant: "gold" },
  { top: "24%", left: "70%", size: 12, depth: 0.4, variant: "leaf" },
  { top: "66%", left: "36%", size: 14, depth: 0.8, variant: "blue" },
];

export default function ParallaxBackground() {
  const rafRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const root = document.documentElement;

    function apply() {
      root.style.setProperty("--px", `${targetRef.current.x}px`);
      root.style.setProperty("--py", `${targetRef.current.y}px`);
      rafRef.current = null;
    }

    function schedule() {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(apply);
    }

    function onPointerMove(e) {
      targetRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 60,
        y: (e.clientY / window.innerHeight - 0.5) * 60,
      };
      schedule();
    }

    function onTouchMove(e) {
      const t = e.touches[0];
      if (!t) return;
      targetRef.current = {
        x: (t.clientX / window.innerWidth - 0.5) * 40,
        y: (t.clientY / window.innerHeight - 0.5) * 40,
      };
      schedule();
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="parallax-bg" aria-hidden="true">
      <div className="parallax-grid" />
      {DOTS.map((d, i) => (
        <span
          key={i}
          className={`parallax-dot parallax-${d.variant}`}
          style={{
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            "--depth": d.depth,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}
