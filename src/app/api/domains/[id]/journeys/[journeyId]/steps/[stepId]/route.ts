import { NextRequest, NextResponse } from "next/server";
import { getDomainById } from "@/lib/services/domain";
import { getJourneyById } from "@/lib/services/journey";
import {
  updateJourneyStep,
  deleteJourneyStep,
} from "@/lib/services/journey-step";

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; journeyId: string; stepId: string }> }
) {
  try {
    const { id, journeyId, stepId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const body = await request.json();
    await updateJourneyStep(stepId, id, {
      name: body.name,
      description: body.description,
      kind: body.kind,
      order: body.order,
      posX: body.posX,
      posY: body.posY,
      imageUrl: body.imageUrl,
      behavioralEventId: body.behavioralEventId,
      applicationEventId: body.applicationEventId,
      communicationPointName: body.communicationPointName,
      triggerEvent: body.triggerEvent,
    });

    const journey = await getJourneyById(journeyId, id);
    return NextResponse.json({ journey });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update step" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; journeyId: string; stepId: string }> }
) {
  try {
    const { id, journeyId, stepId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    await deleteJourneyStep(stepId, id);
    const journey = await getJourneyById(journeyId, id);
    return NextResponse.json({ journey });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete step" },
      { status: 500 }
    );
  }
}
