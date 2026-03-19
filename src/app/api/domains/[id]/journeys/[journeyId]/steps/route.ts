import { NextRequest, NextResponse } from "next/server";
import { getDomainById } from "@/lib/services/domain";
import { getJourneyById } from "@/lib/services/journey";
import { createJourneyStep } from "@/lib/services/journey-step";

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
    await createJourneyStep(id, {
      name: body.name ?? "New step",
      description: body.description,
      kind: body.kind ?? "STATE",
      journeyId,
      posX: body.posX ?? 0,
      posY: body.posY ?? 0,
      behavioralEventId: body.behavioralEventId,
      applicationEventId: body.applicationEventId,
      communicationPointName: body.communicationPointName,
      triggerEvent: body.triggerEvent,
    });

    const updated = await getJourneyById(journeyId, id);
    return NextResponse.json({ journey: updated }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create journey step" },
      { status: 500 }
    );
  }
}
