import { NextRequest, NextResponse } from "next/server";
import {
  listApplicationEventsByDomain,
  createApplicationEvent,
  createApplicationEventsBulk,
} from "@/lib/services/application-event";
import { createApplicationEventSchema } from "@/lib/validations/application-event";
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
    const events = await listApplicationEventsByDomain(id);
    return NextResponse.json({ events });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch application events" },
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
        const parsed = createApplicationEventSchema.safeParse(e);
        if (!parsed.success) {
          return NextResponse.json(
            { error: `Invalid event: ${parsed.error.message}` },
            { status: 400 }
          );
        }
      }
      await createApplicationEventsBulk(
        id,
        events.map((e: unknown) => createApplicationEventSchema.parse(e))
      );
      const all = await listApplicationEventsByDomain(id);
      return NextResponse.json({ events: all });
    }

    const parsed = createApplicationEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const event = await createApplicationEvent(id, parsed.data);
    return NextResponse.json({ event });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create application event" },
      { status: 500 }
    );
  }
}
