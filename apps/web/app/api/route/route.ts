import { NextResponse } from "next/server";
import { z } from "zod";
import { chooseModel } from "@/lib/model-router";
import { makeLimiter, isAllowed, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 20;

// The router itself is a cheap model call, so keep it lightly rate-limited.
const limiter = makeLimiter({ tokens: 20, window: "1 m", prefix: "route" });

const schema = z.object({ query: z.string().min(1).max(500) });

export async function POST(req: Request) {
  if (!(await isAllowed(clientIp(req), limiter))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const d = await chooseModel(parsed.data.query);
  return NextResponse.json({
    model: d.entry.label,
    modelId: d.entry.id,
    provider: d.entry.provider,
    tier: d.entry.tier,
    reason: d.reason,
  });
}
