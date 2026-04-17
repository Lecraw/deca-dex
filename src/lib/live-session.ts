import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const HOST_PASSWORD = "password123";

const HMAC_KEY =
  (process.env.NEXTAUTH_SECRET ?? "duzz-live-fallback-secret") +
  "|duzz-live-v1";

export const HOST_COOKIE = "duzz_host";
export const PARTICIPANT_COOKIE = "duzz_participant";

const HOST_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const PARTICIPANT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function hmac(payload: string): string {
  return crypto.createHmac("sha256", HMAC_KEY).update(payload).digest("hex");
}

export function signToken(payload: Record<string, unknown>, ttlMs: number): string {
  const exp = Date.now() + ttlMs;
  const body = b64url(JSON.stringify({ ...payload, exp }));
  return `${body}.${hmac(body)}`;
}

export function verifyToken<T = Record<string, unknown>>(
  token: string | undefined | null
): (T & { exp: number }) | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = hmac(body);
  // timing-safe compare on hex strings of equal length
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body).toString("utf8")) as T & {
      exp: number;
    };
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // compare with a dummy buffer of the same length to keep the compare time roughly constant
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

type CookieSetter = {
  set: (args: {
    name: string;
    value: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    path?: string;
    maxAge?: number;
  }) => void;
};

function applyCookie(
  res: NextResponse,
  name: string,
  value: string,
  maxAgeMs: number
) {
  (res.cookies as unknown as CookieSetter).set({
    name,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  });
}

export function setHostCookie(res: NextResponse) {
  const token = signToken({ host: true }, HOST_TTL_MS);
  applyCookie(res, HOST_COOKIE, token, HOST_TTL_MS);
}

export function clearHostCookie(res: NextResponse) {
  (res.cookies as unknown as CookieSetter).set({
    name: HOST_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function setParticipantCookie(
  res: NextResponse,
  participantId: string,
  sessionId: string
) {
  const token = signToken(
    { participantId, sessionId },
    PARTICIPANT_TTL_MS
  );
  applyCookie(res, PARTICIPANT_COOKIE, token, PARTICIPANT_TTL_MS);
}

export function clearParticipantCookie(res: NextResponse) {
  (res.cookies as unknown as CookieSetter).set({
    name: PARTICIPANT_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readHost(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(HOST_COOKIE)?.value;
  const payload = verifyToken<{ host?: boolean }>(raw);
  return !!payload?.host;
}

export async function readParticipant(): Promise<{
  participantId: string;
  sessionId: string;
} | null> {
  const store = await cookies();
  const raw = store.get(PARTICIPANT_COOKIE)?.value;
  const payload = verifyToken<{ participantId: string; sessionId: string }>(raw);
  if (!payload?.participantId || !payload?.sessionId) return null;
  return {
    participantId: payload.participantId,
    sessionId: payload.sessionId,
  };
}

/**
 * Generate a 6-digit numeric join code, excluding confusable patterns.
 */
export function generateCode(): string {
  while (true) {
    const n = crypto.randomInt(100000, 1000000); // 100000..999999
    const s = String(n);
    // exclude all-same-digit like 111111
    if (/^(\d)\1{5}$/.test(s)) continue;
    // exclude trivial ascending/descending runs
    if (s === "123456" || s === "234567" || s === "345678" || s === "456789")
      continue;
    if (s === "987654" || s === "876543" || s === "765432" || s === "654321")
      continue;
    return s;
  }
}

/**
 * Best-effort per-key rate limit using a database-backed bucket.
 * Returns true if the request is ALLOWED, false if rate-limited.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  const existing = await prisma.rateLimitBucket.findUnique({ where: { key } });

  if (!existing || existing.resetAt < now) {
    await prisma.rateLimitBucket.upsert({
      where: { key },
      update: { count: 1, resetAt },
      create: { key, count: 1, resetAt },
    });
    return true;
  }

  if (existing.count >= limit) return false;

  await prisma.rateLimitBucket.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return true;
}

export function extractIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
