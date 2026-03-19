import { NextRequest, NextResponse } from "next/server";
import {
  listBehavioralEventsByDomain,
  createBehavioralEvent,
  createBehavioralEventsBulk,
} from "@/lib/services/behavioral-event";
import { createBehavioralEventSchema } from "@/lib/validations/behavioral-event";
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
    const events = await listBehavioralEventsByDomain(id);
    return NextResponse.json({ events });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch behavioral events" },
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

    if (body.bulk && Array.isArray(body.events)) {
      const events = body.events;
      for (const e of events) {
        const parsed = createBehavioralEventSchema.safeParse(e);
        if (!parsed.success) {
          return NextResponse.json(
            { error: `Invalid event: ${parsed.error.message}` },
            { status: 400 }
          );
        }
      }
      await createBehavioralEventsBulk(
        id,
        events.map((e: unknown) => createBehavioralEventSchema.parse(e))
      );
      const all = await listBehavioralEventsByDomain(id);
      return NextResponse.json({ events: all });
    }

    const parsed = createBehavioralEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const event = await createBehavioralEvent(id, parsed.data);
    return NextResponse.json({ event });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create behavioral event" },
      { status: 500 }
    );
  }
}
