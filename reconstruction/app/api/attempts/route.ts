import { NextRequest } from "next/server";
import { owner, json } from "@/lib/http";
import { saveAttempt } from "@/lib/db";
import type { Attempt } from "@/lib/types";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (
    req.headers.get("origin") !== (process.env.APP_ORIGIN ?? req.nextUrl.origin)
  )
    return json({ error: "Origin is not allowed" }, 403);
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    return json({ error: "JSON required" }, 415);
  const user = owner(req);
  if (!user)
    return json({ error: "Open the application to initialize a session" }, 401);
  const reader = req.body?.getReader();
  if (!reader) return json({ error: "Missing body" }, 400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > 128_000) {
      await reader.cancel();
      return json({ error: "Request too large" }, 413);
    }
    chunks.push(part.value);
  }
  try {
    const a = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Attempt;
    if (!a || typeof a !== "object" || Array.isArray(a))
      return json({ error: "Invalid attempt" }, 400);
    if (
      typeof a.id !== "string" ||
      !/^[-a-zA-Z0-9]{16,80}$/.test(a.id) ||
      typeof a.lineId !== "string" ||
      !Array.isArray(a.inputs) ||
      a.inputs.length < 1 ||
      a.inputs.length > 256 ||
      !a.inputs.every((x) => typeof x === "string" && x.length <= 500) ||
      typeof a.punctuation !== "boolean" ||
      !Number.isFinite(a.durationMs) ||
      a.durationMs < 1 ||
      a.durationMs > 3_600_000 ||
      !Number.isInteger(a.replays) ||
      a.replays < 0 ||
      a.replays > 1000 ||
      !["story", "review"].includes(a.mode)
    )
      return json({ error: "Invalid attempt" }, 400);
    return json(await saveAttempt(user, a));
  } catch (e) {
    if (e instanceof SyntaxError) return json({ error: "Malformed JSON" }, 400);
    if (
      e instanceof Error &&
      ["Unknown line", "The line is incomplete"].includes(e.message)
    )
      return json({ error: e.message }, 422);
    console.error("Attempt persistence failed");
    return json({ error: "Could not save this attempt" }, 500);
  }
}
