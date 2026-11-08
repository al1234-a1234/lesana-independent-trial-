import { Pool, type PoolClient } from "pg";
import { schedule } from "./scheduler";
import { accuracy, prepareTarget, replay } from "./engine";
import { findLine } from "./catalog";
import type { AppState, Attempt, Progress } from "./types";

let pool: Pool | undefined;
export function db() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 10000 });
  }
  return pool;
}
async function readStateWith(owner: string, client: Pool | PoolClient): Promise<AppState> {
  const [progress, favorites, known, core, passages] = await Promise.all([
    client.query("SELECT data FROM progress WHERE owner=$1", [owner]),
    client.query("SELECT word FROM favorite_words WHERE owner=$1", [owner]),
    client.query("SELECT word FROM known_words WHERE owner=$1", [owner]),
    client.query("SELECT group_id,score,completed_at FROM core_groups WHERE owner=$1", [owner]),
    client.query("SELECT passage_id,score,answered,completed_at FROM passage_progress WHERE owner=$1", [owner]),
  ]);
  return {
    records: progress.rows.map(r => r.data as Progress),
    favoriteWords: favorites.rows.map(r => r.word as string),
    knownWords: known.rows.map(r => r.word as string),
    coreGroups: core.rows.map(r => ({ groupId:r.group_id as string, score:Number(r.score), completedAt:Number(r.completed_at) })),
    passages: passages.rows.map(r => ({ passageId:r.passage_id as string, score:Number(r.score), answered:Number(r.answered), completedAt:Number(r.completed_at) })),
    serverNow: Date.now(),
  };
}
export async function readState(owner: string): Promise<AppState> {
  if (process.env.TRIAL_NO_DATABASE === "1") return {
    records: [], favoriteWords: [], knownWords: [], coreGroups: [], passages: [], serverNow: Date.now(),
  };
  return readStateWith(owner, db());
}
export async function saveAttempt(owner: string, a: Attempt) {
  const line = findLine(a.lineId);
  if (!line) throw new Error("Unknown line");
  const target = prepareTarget(line.text, a.punctuation);
  const result = replay(a.inputs, target, a.punctuation);
  if (!result.done) throw new Error("The line is incomplete");
  if (process.env.TRIAL_NO_DATABASE === "1") {
    // Demo only: validate completion, acknowledge without claiming persistence.
    return { duplicate: false, ...await readState(owner) };
  }
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const now = Date.now();
    const inserted = await client.query("INSERT INTO attempts(owner,id,line_id,created_at) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING id", [owner,a.id,line.id,now]);
    if (!inserted.rowCount) {
      await client.query("COMMIT");
      return { duplicate: true, ...await readState(owner) };
    }
    const old = await client.query("SELECT data FROM progress WHERE owner=$1 AND line_id=$2 FOR UPDATE", [owner,a.lineId]);
    const previous = old.rows[0]?.data as Progress | undefined;
    const record: Progress = {
      lineId: line.id, correct: result.correct, wrong: result.wrong, accuracy: accuracy(result),
      ...schedule(previous, { accuracy: accuracy(result), wrong: result.wrong }, now),
      attempts: (previous?.attempts ?? 0) + 1, updatedAt: now,
    };
    await client.query("INSERT INTO progress(owner,line_id,data) VALUES ($1,$2,$3) ON CONFLICT(owner,line_id) DO UPDATE SET data=excluded.data", [owner,line.id,record]);
    await client.query("COMMIT");
    return { duplicate: false, ...await readState(owner) };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
