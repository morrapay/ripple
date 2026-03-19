import { NextRequest, NextResponse } from "next/server";
import { getDomainById } from "@/lib/services/domain";
import { splitJourney } from "@/lib/services/journey";

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

    const body = await request.json();
    if (!body.stepId) {
      return NextResponse.json(
        { error: "stepId is required" },
        { status: 400 }
      );
    }

    const result = await splitJourney(journeyId, id, body.stepId);
    if (!result) {
      return NextResponse.json(
        { error: "Journey or step not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to split journey" },
      { status: 500 }
    );
  }
}
