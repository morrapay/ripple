import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomainById } from "@/lib/services/domain";
import { getJourneyById } from "@/lib/services/journey";
import {
  createEdge,
  deleteEdge,
  listEdgesByJourney,
} from "@/lib/services/journey-edge";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; journeyId: string }> }
) {
  try {
    const { id, journeyId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }
    const journey = await getJourneyById(journeyId, id);
    if (!journey) {
      return NextResponse.json(
        { error: "Journey not found" },
        { status: 404 }
      );
    }

    const edges = await listEdgesByJourney(journeyId);
    return NextResponse.json({ edges });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to list journey edges" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; journeyId: string }> }
) {
  try {
    const { id, journeyId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }
    const journey = await getJourneyById(journeyId, id);
    if (!journey) {
      return NextResponse.json(
        { error: "Journey not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const sourceStepId = body.sourceStepId as string | undefined;
    const targetStepId = body.targetStepId as string | undefined;
    if (!sourceStepId || !targetStepId) {
      return NextResponse.json(
        { error: "sourceStepId and targetStepId are required" },
        { status: 400 }
      );
    }

    const edge = await createEdge({
      journeyId,
      sourceStepId,
      targetStepId,
      label: body.label,
      condition: body.condition,
      sortOrder: body.sortOrder,
    });

    if (!edge) {
      return NextResponse.json(
        { error: "Source or target step not found for this journey" },
        { status: 400 }
      );
    }

    return NextResponse.json({ edge }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create journey edge" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; journeyId: string }> }
) {
  try {
    const { id, journeyId } = await params;
    const edgeId = request.nextUrl.searchParams.get("edgeId");
    if (!edgeId) {
      return NextResponse.json(
        { error: "Query parameter edgeId is required" },
        { status: 400 }
      );
    }

    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }
    const journey = await getJourneyById(journeyId, id);
    if (!journey) {
      return NextResponse.json(
        { error: "Journey not found" },
        { status: 404 }
      );
    }

    const existing = await prisma.journeyEdge.findFirst({
      where: { id: edgeId, journeyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Edge not found" }, { status: 404 });
    }

    await deleteEdge(edgeId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete journey edge" },
      { status: 500 }
    );
  }
}
