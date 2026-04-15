import { NextRequest, NextResponse } from "next/server";
import {
  listJourneyStepsByDomain,
  createJourneyStep,
} from "@/lib/services/journey-step";
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
    const steps = await listJourneyStepsByDomain(id);
    return NextResponse.json({ steps });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch journey steps" },
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
    const steps = await createJourneyStep(id, {
      name: body.name ?? "New step",
      description: body.description,
      kind: body.kind ?? "STATE",
      behavioralEventId: body.behavioralEventId,
      applicationEventId: body.applicationEventId,
      communicationPointName: body.communicationPointName,
      triggerEvent: body.triggerEvent,
    });
    return NextResponse.json({ steps });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create journey step" },
      { status: 500 }
    );
  }
}
