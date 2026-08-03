import { sql } from "@vercel/postgres";

const TOP_N = 10;

export async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS scores (
      id SERIAL PRIMARY KEY,
      player_name TEXT NOT NULL,
      game_id TEXT NOT NULL,
      best_score INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (player_name, game_id)
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS event_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      paused BOOLEAN NOT NULL DEFAULT false,
      CHECK (id = 1)
    );
  `;
  // Self-healing for installs where event_state already existed before the
  // `pin` column was introduced — CREATE TABLE IF NOT EXISTS above is a
  // no-op against an existing table, so add the column separately.
  await sql`ALTER TABLE event_state ADD COLUMN IF NOT EXISTS pin TEXT NOT NULL DEFAULT '0000';`;
  await sql`
    INSERT INTO event_state (id, paused, pin) VALUES (1, false, '0000')
    ON CONFLICT (id) DO NOTHING;
  `;
}

// One-time destructive migration from the old team-based schema (teams +
// scores.team_id) to this player-only schema. Safe to call more than once —
// each DROP is a no-op if the table is already gone.
export async function migrateToPlayerOnlySchema() {
  await sql`DROP TABLE IF EXISTS scores;`;
  await sql`DROP TABLE IF EXISTS teams;`;
  await ensureSchema();
}

export async function isPaused() {
  const { rows } = await sql`SELECT paused FROM event_state WHERE id = 1;`;
  return rows[0]?.paused ?? false;
}

export async function setPaused(paused) {
  await sql`
    INSERT INTO event_state (id, paused) VALUES (1, ${paused})
    ON CONFLICT (id) DO UPDATE SET paused = ${paused};
  `;
}

export async function getEventPin() {
  const { rows } = await sql`SELECT pin FROM event_state WHERE id = 1;`;
  return rows[0]?.pin ?? null;
}

export async function setEventPin(pin) {
  await sql`
    INSERT INTO event_state (id, pin) VALUES (1, ${pin})
    ON CONFLICT (id) DO UPDATE SET pin = ${pin};
  `;
}

// Only raises best_score if the new score is higher. The WHERE clause on the
// upsert makes this safe against simultaneous submissions — Postgres
// resolves the conflict atomically rather than the app reading-then-writing.
export async function submitScore({ playerName, gameId, score }) {
  await sql`
    INSERT INTO scores (player_name, game_id, best_score, updated_at)
    VALUES (${playerName}, ${gameId}, ${score}, now())
    ON CONFLICT (player_name, game_id)
    DO UPDATE SET best_score = ${score}, updated_at = now()
    WHERE scores.best_score < ${score};
  `;
}

export async function getPlayerBestScores(playerName) {
  const { rows } = await sql`
    SELECT game_id, best_score FROM scores
    WHERE player_name = ${playerName};
  `;
  const best = {};
  rows.forEach((r) => (best[r.game_id] = r.best_score));
  return best;
}

export async function getGameLeaderboards() {
  const { rows } = await sql`
    SELECT game_id, player_name, best_score
    FROM scores
    ORDER BY game_id, best_score DESC;
  `;

  const byGame = {};
  rows.forEach((row) => {
    if (!byGame[row.game_id]) byGame[row.game_id] = [];
    if (byGame[row.game_id].length < TOP_N) byGame[row.game_id].push(row);
  });

  return byGame;
}
