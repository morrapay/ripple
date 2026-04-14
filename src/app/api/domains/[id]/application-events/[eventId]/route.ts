import { NextRequest, NextResponse } from "next/server";
import {
  updateApplicationEvent,
  deleteApplicationEvent,
} from "@/lib/services/application-event";
import { updateApplicationEventSchema } from "@/lib/validations/application-event";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const { id, eventId } = await params;
    const body = await request.json();
    const parsed = updateApplicationEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const event = await updateApplicationEvent(eventId, id, parsed.data);
    if (!event) {
      return NextResponse.json(
        { error: "Application event not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ event });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update application event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const { id, eventId } = await params;
    const deleted = await deleteApplicationEvent(eventId, id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Application event not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete application event" },
      { status: 500 }
    );
  }
}
