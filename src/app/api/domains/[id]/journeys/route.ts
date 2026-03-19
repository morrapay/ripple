import { NextRequest, NextResponse } from "next/server";
import { getDomainById } from "@/lib/services/domain";
import {
  listJourneysByDomain,
  createJourney,
} from "@/lib/services/journey";

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
    const journeys = await listJourneysByDomain(id);
    return NextResponse.json({ journeys });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch journeys" },
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
    const journey = await createJourney(id, {
      name: body.name ?? "Untitled Journey",
      description: body.description,
    });
    return NextResponse.json({ journey }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create journey" },
      { status: 500 }
    );
  }
}
