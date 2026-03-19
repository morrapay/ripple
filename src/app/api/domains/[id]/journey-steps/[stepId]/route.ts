import { NextRequest, NextResponse } from "next/server";
import {
  updateJourneyStep,
  deleteJourneyStep,
} from "@/lib/services/journey-step";
import { getDomainById } from "@/lib/services/domain";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { id, stepId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }
    const body = await request.json();
    const steps = await updateJourneyStep(stepId, id, {
      name: body.name,
      description: body.description,
      kind: body.kind,
      order: body.order,
      behavioralEventId: body.behavioralEventId,
      applicationEventId: body.applicationEventId,
      communicationPointName: body.communicationPointName,
      triggerEvent: body.triggerEvent,
    });
    if (!steps) {
      return NextResponse.json({ error: "Journey step not found" }, { status: 404 });
    }
    return NextResponse.json({ steps });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update journey step" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { id, stepId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }
    const steps = await deleteJourneyStep(stepId, id);
    if (!steps) {
      return NextResponse.json({ error: "Journey step not found" }, { status: 404 });
    }
    return NextResponse.json({ steps });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete journey step" },
      { status: 500 }
    );
  }
}
