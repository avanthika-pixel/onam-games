// Normalizes a display name so casing/spacing differences never create
// duplicate players: "avanthika cinesh", "AVANTHIKA CINESH", and
// "Avanthika  Cinesh" all resolve to the same stored name.
//
// Only title-cases tokens that are purely alphabetic ("cinesh" -> "Cinesh").
// Tokens with a period or digit — e.g. compound initials like "M.S" or
// "K.R", common in this event's name list — are left exactly as given,
// since naively title-casing them would turn "M.S" into "M.s".
export function normalizeName(name) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => {
      if (!w) return w;
      if (/^[A-Za-z]+$/.test(w)) {
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }
      return w;
    })
    .join(" ");
}
