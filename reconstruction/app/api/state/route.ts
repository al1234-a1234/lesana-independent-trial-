import { NextRequest } from "next/server";
import { readState } from "@/lib/db";
import { COOKIE, json, owner, session } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const existing = owner(req);
  if (existing) return json(await readState(existing));
  const s = session(req);
  const response = json(await readState(s.owner));
  response.cookies.set(COOKIE, s.token, {
    httpOnly: true,
    sameSite: "strict",
    secure: s.secure,
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  return response;
}
