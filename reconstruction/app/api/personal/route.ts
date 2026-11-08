import { NextRequest } from "next/server";
import { owner, json } from "@/lib/http";
import { applyPersonal, type PersonalAction } from "@/lib/personal";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== (process.env.APP_ORIGIN ?? req.nextUrl.origin)) return json({error:"Origin is not allowed"},403);
  if (!req.headers.get("content-type")?.startsWith("application/json")) return json({error:"JSON required"},415);
  const user=owner(req);
  if (!user) return json({error:"Session required"},401);
  const reader=req.body?.getReader();
  if(!reader)return json({error:"Missing body"},400);
  const chunks:Uint8Array[]=[];
  let size=0;
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>2048){await reader.cancel();return json({error:"Request too large"},413)}chunks.push(part.value)}
  try {
    const action=JSON.parse(Buffer.concat(chunks).toString("utf8")) as PersonalAction;
    if (!action || typeof action!=="object" || Array.isArray(action)) return json({error:"Invalid action"},400);
    return json(await applyPersonal(user,action));
  } catch(e) {
    if (e instanceof SyntaxError) return json({error:"Malformed JSON"},400);
    if (e instanceof Error && /^(Invalid|Confirmation)/.test(e.message)) return json({error:e.message},422);
    console.error("Personal state persistence failed");
    return json({error:"Could not save"},500);
  }
}
