import core from "@/content/core-vocabulary.json";
import { db, readState } from "./db";
import { allLines } from "./catalog";
import passages from "@/content/passages.json";
import { knownWords } from "./known-game";

const allowedWords = new Set([...core.flatMap((g) => g.words.map((w) => w.en)), ...allLines.map((l) => l.keyword.en),...knownWords.map((w)=>w.en)]);
const allowedGroups = new Set(core.map((g) => g.id));
const allowedPassages = new Map(passages.map((p) => [p.slug,p]));
export type PersonalAction =
  | { type: "favorite"; word: string; enabled: boolean }
  | { type: "core"; groupId: string; answers: string[] }
  | { type: "passage"; passageId: string; answers: boolean[] }
  | { type: "known"; words: string[] }
  | { type: "delete"; confirmation: "DELETE MY TRIAL DATA" };
export async function applyPersonal(owner: string, action: PersonalAction) {
  if (process.env.TRIAL_NO_DATABASE === "1") {
    if (action.type === "favorite" && (!allowedWords.has(action.word) || typeof action.enabled !== "boolean")) throw new Error("Invalid favorite");
    else if (action.type === "core" && (!allowedGroups.has(action.groupId) || !Array.isArray(action.answers) || action.answers.length !== 5)) throw new Error("Invalid core result");
    else if (action.type === "passage" && (!allowedPassages.has(action.passageId) || !Array.isArray(action.answers))) throw new Error("Invalid passage result");
    else if (action.type === "known" && (!Array.isArray(action.words) || action.words.length > knownWords.length)) throw new Error("Invalid known words");
    else if (action.type === "delete" && action.confirmation !== "DELETE MY TRIAL DATA") throw new Error("Confirmation required");
    else if (!["favorite", "core", "passage", "known", "delete"].includes(action.type)) throw new Error("Invalid action");
    return readState(owner);
  }
  const conn = db();
  if (action.type === "favorite") {
    if (!allowedWords.has(action.word) || typeof action.enabled !== "boolean") throw new Error("Invalid favorite");
    if (action.enabled) await conn.query("INSERT INTO favorite_words(owner,word) VALUES ($1,$2) ON CONFLICT DO NOTHING",[owner,action.word]);
    else await conn.query("DELETE FROM favorite_words WHERE owner=$1 AND word=$2",[owner,action.word]);
  } else if (action.type === "core") {
    if (!allowedGroups.has(action.groupId) || !Array.isArray(action.answers) || action.answers.length !== 5 || !action.answers.every((x)=>typeof x==="string" && x.length<=60)) throw new Error("Invalid core result");
    const group=core.find((g)=>g.id===action.groupId)!;
    if (group.number>1) {
      const prior=(await conn.query("SELECT score FROM core_groups WHERE owner=$1 AND group_id=$2",[owner,`${group.level}-${group.number-1}`])).rows[0] as {score:number}|undefined;
      if(!prior || prior.score<4) throw new Error("Invalid locked group");
    }
    const score=group.words.slice(0,5).filter((w,i)=>w.en.toLowerCase()===action.answers[i].trim().toLowerCase()).length;
    await conn.query("INSERT INTO core_groups(owner,group_id,score,completed_at) VALUES ($1,$2,$3,$4) ON CONFLICT(owner,group_id) DO UPDATE SET score=GREATEST(core_groups.score,excluded.score),completed_at=excluded.completed_at",[owner,action.groupId,score,Date.now()]);
  } else if (action.type === "passage") {
    const passage=allowedPassages.get(action.passageId);
    if (!passage || !Array.isArray(action.answers) || action.answers.length!==passage.sections.length || !action.answers.every((a)=>typeof a==="boolean")) throw new Error("Invalid passage result");
    const score=passage.sections.filter((s,i)=>s.correct===action.answers[i]).length;
    await conn.query("INSERT INTO passage_progress(owner,passage_id,score,answered,completed_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT(owner,passage_id) DO UPDATE SET score=excluded.score,answered=excluded.answered,completed_at=excluded.completed_at",[owner,action.passageId,score,action.answers.length,Date.now()]);
  } else if (action.type === "known") {
    if(!Array.isArray(action.words)||action.words.length>knownWords.length||!action.words.every((w)=>typeof w==="string"&&knownWords.some((x)=>x.en===w)))throw new Error("Invalid known words");
    for(const word of new Set(action.words)) await conn.query("INSERT INTO known_words(owner,word) VALUES ($1,$2) ON CONFLICT DO NOTHING",[owner,word]);
  } else if (action.type === "delete") {
    if (action.confirmation !== "DELETE MY TRIAL DATA") throw new Error("Confirmation required");
    const client = await conn.connect();
    try {
      await client.query("BEGIN");
      for (const table of ["progress","attempts","favorite_words","known_words","core_groups","passage_progress"])
        await client.query(`DELETE FROM ${table} WHERE owner=$1`,[owner]);
      await client.query("COMMIT");
    } catch(e) { await client.query("ROLLBACK"); throw e; }
    finally { client.release(); }
  } else throw new Error("Invalid action");
  return await readState(owner);
}
