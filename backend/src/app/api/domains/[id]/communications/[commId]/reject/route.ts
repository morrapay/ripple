import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commId: string }> }
) {
  try {
    const { id, commId } = await params;
    await request.json().catch(() => ({}));

    const existing = await prisma.communication.findFirst({
      where: { id: commId, domainId: id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Communication not found" },
        { status: 404 }
      );
    }

    const communication = await prisma.communication.update({
      where: { id: commId },
      data: {
        contentApprovalStatus: "REJECTED",
      },
      include: {
        domain: { select: { id: true, name: true } },
        communicationPoint: { include: { journeyStep: true } },
        template: true,
      },
    });

    return NextResponse.json({ communication });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to reject communication" },
      { status: 500 }
    );
  }
}
