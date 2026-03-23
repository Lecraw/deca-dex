import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Authenticate via NextAuth session OR Bearer token (for browser extension).
 * Returns a session-like object with user info, or null if unauthenticated.
 */
export async function getSessionOrToken(req?: Request) {
  // First try standard NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session;

  // Fall back to Bearer token
  if (!req) return null;
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  const tokenHash = sha256(token);

  const apiToken = await prisma.apiToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!apiToken) return null;
  if (apiToken.expiresAt && apiToken.expiresAt < new Date()) return null;

  // Update last used (fire and forget)
  prisma.apiToken
    .update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return {
    user: {
      id: apiToken.user.id,
      name: apiToken.user.name,
      email: apiToken.user.email,
      image: apiToken.user.image,
    },
  };
}

/**
 * Generate a new API token for the given user.
 * Returns the raw token (shown once) and the created record.
 */
export async function generateApiToken(userId: string, name: string) {
  const rawToken = `nxr_${crypto.randomBytes(32).toString("hex")}`;
  const tokenHash = sha256(rawToken);

  const record = await prisma.apiToken.create({
    data: {
      userId,
      name,
      tokenHash,
    },
  });

  return { rawToken, record };
}
