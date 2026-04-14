import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commId: string }> }
) {
  try {
    const { id, commId } = await params;

    const comm = await prisma.communication.findFirst({
      where: { id: commId, domainId: id },
      select: { id: true },
    });

    if (!comm) {
      return NextResponse.json(
        { error: "Communication not found" },
        { status: 404 }
      );
    }

    const tickets = await prisma.ticket.findMany({
      where: { communicationId: commId, domainId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to list tickets" },
      { status: 500 }
    );
  }
}
