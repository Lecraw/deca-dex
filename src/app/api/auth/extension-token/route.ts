import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiToken } from "@/lib/auth-token";

// List tokens for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokens = await prisma.apiToken.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      lastUsedAt: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tokens);
}

// Generate a new token
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = body.name || "Browser Extension";

  const { rawToken, record } = await generateApiToken(session.user.id, name);

  return NextResponse.json(
    {
      token: rawToken,
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
    },
    { status: 201 }
  );
}

// Revoke a token
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tokenId = searchParams.get("id");

  if (!tokenId) {
    return NextResponse.json({ error: "Missing token id" }, { status: 400 });
  }

  await prisma.apiToken.deleteMany({
    where: { id: tokenId, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
