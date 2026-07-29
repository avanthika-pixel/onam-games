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
  await sql`
    CREATE TABLE IF NOT EXISTS event_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      paused BOOLEAN NOT NULL DEFAULT false,
      CHECK (id = 1)
    );
  `;
  await sql`
    INSERT INTO event_state (id, paused) VALUES (1, false)
    ON CONFLICT (id) DO NOTHING;
  `;
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

function rowsToRoster(scoreRows) {
  const players = {};
  scoreRows.forEach((r) => {
    if (!players[r.player_name]) {
      players[r.player_name] = { name: r.player_name, scores: {}, total: 0 };
    }
    players[r.player_name].scores[r.game_id] = r.best_score;
    players[r.player_name].total += r.best_score;
  });
  return Object.values(players).sort((a, b) => b.total - a.total);
}

export async function getTeamRoster(teamId) {
  const { rows: teamRows } = await sql`SELECT id, name FROM teams WHERE id = ${teamId};`;
  const team = teamRows[0] || null;
  if (!team) return null;

  const { rows } = await sql`
    SELECT player_name, game_id, best_score FROM scores
    WHERE team_id = ${teamId};
  `;
  return { team, players: rowsToRoster(rows) };
}

export async function getAllTeamRosters() {
  const { rows: teams } = await sql`SELECT id, name FROM teams ORDER BY id;`;
  const { rows: scores } = await sql`SELECT team_id, player_name, game_id, best_score FROM scores;`;

  const byTeam = {};
  teams.forEach((t) => (byTeam[t.id] = []));
  scores.forEach((s) => {
    if (byTeam[s.team_id]) byTeam[s.team_id].push(s);
  });

  return teams.map((t) => ({ team: t, players: rowsToRoster(byTeam[t.id]) }));
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
