import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomainById } from "@/lib/services/domain";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const categories = await prisma.preferenceCategory.findMany({
      where: { domainId: id },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to list preference categories" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const maxOrder = await prisma.preferenceCategory.aggregate({
      where: { domainId: id },
      _max: { displayOrder: true },
    });
    const nextOrder =
      body.displayOrder !== undefined && typeof body.displayOrder === "number"
        ? body.displayOrder
        : (maxOrder._max.displayOrder ?? -1) + 1;

    const category = await prisma.preferenceCategory.create({
      data: {
        domainId: id,
        name,
        description:
          typeof body.description === "string" ? body.description : undefined,
        canOptOut:
          typeof body.canOptOut === "boolean" ? body.canOptOut : true,
        mandatory:
          typeof body.mandatory === "boolean" ? body.mandatory : false,
        icon: typeof body.icon === "string" ? body.icon : null,
        displayOrder: nextOrder,
      },
    });

    return NextResponse.json({ category });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create preference category" },
      { status: 500 }
    );
  }
}
