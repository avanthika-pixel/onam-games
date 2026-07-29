// ---- Edit these for your event ----

// Team numbers shown in the team-select screen.
export const TEAMS = [1, 2, 3, 4];

// Site stops accepting new scores after this local datetime.
export const EVENT_END = "2026-08-18T17:00:00";

export const GAMES = [
  {
    id: "boat",
    name: "Vallam Kali Dash",
    tagline: "Paddle the snake boat, dodge the obstacles.",
    accent: "#7A1F2B",
  },
  {
    id: "pookalam",
    name: "Pookalam Rush",
    tagline: "Recreate the flower rangoli before time runs out.",
    accent: "#C99A2E",
  },
  {
    id: "anniversary",
    name: "14 Candles",
    tagline: "Collect one candle per year. Fourteen years running.",
    accent: "#1F5C3D",
  },
];

export function isEventOver() {
  return Date.now() > new Date(EVENT_END).getTime();
}
