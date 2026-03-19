import { NextRequest, NextResponse } from "next/server";
import { updateBehavioralEvent, deleteBehavioralEvent } from "@/lib/services/behavioral-event";
import { updateBehavioralEventSchema } from "@/lib/validations/behavioral-event";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const parsed = updateBehavioralEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const event = await updateBehavioralEvent(eventId, parsed.data);
    return NextResponse.json({ event });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update behavioral event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const { eventId } = await params;
    await deleteBehavioralEvent(eventId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2025") {
      return NextResponse.json({ success: true });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete behavioral event" },
      { status: 500 }
    );
  }
}
