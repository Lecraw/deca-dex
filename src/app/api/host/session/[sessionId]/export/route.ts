import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readHost } from "@/lib/live-session";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ sessionId: string }> };

function csvEscape(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  // CSV formula injection guard (Excel/Sheets)
  const needsInjectionPrefix = /^[=+\-@\t\r]/.test(raw);
  const safe = needsInjectionPrefix ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(_req: NextRequest, ctx: RouteParams) {
  if (!(await readHost())) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { sessionId } = await ctx.params;

  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: {
      participants: {
        orderBy: [{ totalScore: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const header = [
    "rank",
    "display_name",
    "email",
    "total_score",
    "completed",
    "joined_at",
    "completed_at",
  ];

  const rows: string[] = [];
  rows.push(header.map(csvEscape).join(","));

  session.participants.forEach((p, i) => {
    rows.push(
      [
        i + 1,
        p.displayName,
        p.email,
        p.totalScore ?? "",
        p.completed ? "yes" : "no",
        p.createdAt.toISOString(),
        p.completedAt ? p.completedAt.toISOString() : "",
      ]
        .map(csvEscape)
        .join(",")
    );
  });

  const csv = "\uFEFF" + rows.join("\r\n") + "\r\n";
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="duzz-session-${session.code}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
