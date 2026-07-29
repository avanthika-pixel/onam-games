const KEY = "onam_session";

export function getSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.name || !data?.team) return null;
    return data;
  } catch {
    return null;
  }
}

export function setSession({ name, team, teamName }) {
  window.localStorage.setItem(KEY, JSON.stringify({ name, team, teamName }));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
}
