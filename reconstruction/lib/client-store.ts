"use client";
import type { AppState, Attempt } from "./types";
const KEY = "satr.pending.v1";
export function pending(): Attempt[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.slice(-200) : [];
  } catch {
    return [];
  }
}
function write(items: Attempt[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(-200)));
  window.dispatchEvent(new Event("satr-pending"));
}
export async function state(): Promise<AppState> {
  const r = await fetch("/api/state", { cache: "no-store" });
  if (!r.ok) throw new Error("تعذّر تحميل التقدم. حاول مرة أخرى.");
  return r.json();
}
async function send(a: Attempt): Promise<AppState> {
  const response = await fetch("/api/attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(a),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Save failed (${response.status})`);
  return response.json();
}
export async function persist(
  a: Attempt,
): Promise<{ saved: boolean; state?: AppState }> {
  // Journal BEFORE sending. A timeout after commit remains safe due to attempt idempotency.
  write([...pending().filter((p) => p.id !== a.id), a]);
  try {
    const result = await send(a);
    write(pending().filter((p) => p.id !== a.id));
    return { saved: true, state: result };
  } catch {
    return { saved: false };
  }
}
let flushing: Promise<AppState | undefined> | null = null;
export function flush(): Promise<AppState | undefined> {
  if (flushing) return flushing;
  flushing = (async () => {
    let result: AppState | undefined;
    for (const item of pending()) {
      try {
        result = await send(item);
        write(pending().filter((p) => p.id !== item.id));
      } catch {
        break;
      }
    }
    return result;
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}
