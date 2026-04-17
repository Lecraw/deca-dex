import { NextRequest, NextResponse } from "next/server";
import {
  HOST_PASSWORD,
  extractIp,
  rateLimit,
  setHostCookie,
  timingSafeEqualStr,
} from "@/lib/live-session";

export async function POST(req: NextRequest) {
  const ip = extractIp(req);
  const allowed = await rateLimit(`hostlogin:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429 }
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!timingSafeEqualStr(password, HOST_PASSWORD)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  setHostCookie(res);
  return res;
}
