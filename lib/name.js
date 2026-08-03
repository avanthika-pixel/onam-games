// Normalizes a display name so casing/spacing differences never create
// duplicate players: "avanthika cinesh", "AVANTHIKA CINESH", and
// "Avanthika  Cinesh" all resolve to the same stored name.
export function normalizeName(name) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}
