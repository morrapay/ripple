import { NextRequest, NextResponse } from "next/server";
import { getDomainById } from "@/lib/services/domain";
import {
  getJourneyById,
  updateJourney,
  deleteJourney,
} from "@/lib/services/journey";

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
    return NextResponse.json({ journey });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch journey" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; journeyId: string }> }
) {
  try {
    const { id, journeyId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }
    const body = await request.json();
    const journey = await updateJourney(journeyId, id, {
      name: body.name,
      description: body.description,
      audience: body.audience,
      objective: body.objective,
      coverImage: body.coverImage,
      entryCriteria: body.entryCriteria,
      exitCriteria: body.exitCriteria,
    });
    if (!journey) {
      return NextResponse.json(
        { error: "Journey not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ journey });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update journey" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; journeyId: string }> }
) {
  try {
    const { id, journeyId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }
    const result = await deleteJourney(journeyId, id);
    if (!result) {
      return NextResponse.json(
        { error: "Journey not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete journey" },
      { status: 500 }
    );
  }
}
