import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { overrides } = await req.json();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Update the complianceJson with overrides
  let complianceData: any = {};
  if (project.complianceJson) {
    complianceData = typeof project.complianceJson === "string"
      ? JSON.parse(project.complianceJson)
      : project.complianceJson;
  }

  complianceData.overrides = overrides || [];

  await prisma.project.update({
    where: { id: projectId },
    data: {
      complianceJson: JSON.stringify(complianceData),
    },
  });

  return NextResponse.json({ ok: true });
}
