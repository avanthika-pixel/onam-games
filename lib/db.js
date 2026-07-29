import { sql } from "@vercel/postgres";
import { TEAMS } from "./config";

export async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      pin TEXT NOT NULL
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS scores (
      id SERIAL PRIMARY KEY,
      team_id INTEGER NOT NULL REFERENCES teams(id),
      player_name TEXT NOT NULL,
      game_id TEXT NOT NULL,
      best_score INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (team_id, player_name, game_id)
    );
  `;
}

export async function seedTeams() {
  await ensureSchema();
  for (const id of TEAMS) {
    await sql`
      INSERT INTO teams (id, name, pin)
      VALUES (${id}, ${`Team ${id}`}, ${`110${id}`})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}

export async function getTeamByIdAndPin(teamId, pin) {
  const { rows } = await sql`
    SELECT id, name FROM teams WHERE id = ${teamId} AND pin = ${pin};
  `;
  return rows[0] || null;
}

export async function listTeams() {
  const { rows } = await sql`SELECT id, name, pin FROM teams ORDER BY id;`;
  return rows;
}

export async function updateTeam(id, name, pin) {
  await sql`
    UPDATE teams SET name = ${name}, pin = ${pin} WHERE id = ${id};
  `;
}

// Only raises best_score if the new score is higher. The WHERE clause on the
// upsert makes this safe against simultaneous submissions — Postgres
// resolves the conflict atomically rather than the app reading-then-writing.
export async function submitScore({ teamId, playerName, gameId, score }) {
  await sql`
    INSERT INTO scores (team_id, player_name, game_id, best_score, updated_at)
    VALUES (${teamId}, ${playerName}, ${gameId}, ${score}, now())
    ON CONFLICT (team_id, player_name, game_id)
    DO UPDATE SET best_score = ${score}, updated_at = now()
    WHERE scores.best_score < ${score};
  `;
}

export async function getPlayerBestScores(teamId, playerName) {
  const { rows } = await sql`
    SELECT game_id, best_score FROM scores
    WHERE team_id = ${teamId} AND player_name = ${playerName};
  `;
  const best = {};
  rows.forEach((r) => (best[r.game_id] = r.best_score));
  return best;
}

export async function getLeaderboard() {
  const { rows: teamTotals } = await sql`
    SELECT t.id, t.name, COALESCE(SUM(s.best_score), 0) AS total
    FROM teams t
    LEFT JOIN scores s ON s.team_id = t.id
    GROUP BY t.id, t.name
    ORDER BY total DESC;
  `;

  const { rows: topScores } = await sql`
    SELECT s.game_id, s.player_name, s.best_score, t.id AS team_id, t.name AS team_name
    FROM scores s
    JOIN teams t ON t.id = s.team_id
    ORDER BY s.game_id, s.best_score DESC;
  `;

  const topByGame = {};
  topScores.forEach((row) => {
    if (!topByGame[row.game_id]) topByGame[row.game_id] = [];
    if (topByGame[row.game_id].length < 5) topByGame[row.game_id].push(row);
  });

  return { teamTotals, topByGame };
}
