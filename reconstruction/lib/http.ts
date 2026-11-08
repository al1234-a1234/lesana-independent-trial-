import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
export const COOKIE = "satr_session";
export function owner(req: NextRequest) {
  const id = req.cookies.get(COOKIE)?.value;
  return id && /^[a-f0-9]{64}$/.test(id)
    ? createHash("sha256").update(id).digest("hex")
    : null;
}
export function session(req: NextRequest) {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    owner: createHash("sha256").update(token).digest("hex"),
    secure: req.nextUrl.protocol === "https:",
  };
}
export const json = (value: unknown, status = 200) =>
  NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
