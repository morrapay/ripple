import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomainById } from "@/lib/services/domain";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; catId: string }> }
) {
  try {
    const { id, catId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const existing = await prisma.preferenceCategory.findFirst({
      where: { id: catId, domainId: id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Preference category not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const category = await prisma.preferenceCategory.update({
      where: { id: catId },
      data: {
        ...(body.name !== undefined && { name: String(body.name) }),
        ...(body.description !== undefined && {
          description:
            body.description === null ? null : String(body.description),
        }),
        ...(body.canOptOut !== undefined && {
          canOptOut: Boolean(body.canOptOut),
        }),
        ...(body.mandatory !== undefined && {
          mandatory: Boolean(body.mandatory),
        }),
        ...(body.icon !== undefined && {
          icon: body.icon === null ? null : String(body.icon),
        }),
        ...(body.displayOrder !== undefined && {
          displayOrder: Number(body.displayOrder),
        }),
      },
    });

    return NextResponse.json({ category });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update preference category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; catId: string }> }
) {
  try {
    const { id, catId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const existing = await prisma.preferenceCategory.findFirst({
      where: { id: catId, domainId: id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Preference category not found" },
        { status: 404 }
      );
    }

    await prisma.preferenceCategory.delete({ where: { id: catId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete preference category" },
      { status: 500 }
    );
  }
}
