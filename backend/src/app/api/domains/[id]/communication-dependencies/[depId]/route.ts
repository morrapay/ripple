import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomainById } from "@/lib/services/domain";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; depId: string }> }
) {
  try {
    const { id, depId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const existing = await prisma.communicationDependency.findFirst({
      where: { id: depId, domainId: id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Dependency not found" },
        { status: 404 }
      );
    }

    await prisma.communicationDependency.delete({
      where: { id: depId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete communication dependency" },
      { status: 500 }
    );
  }
}
