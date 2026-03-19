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
    const { eventId } = await params;
    const body = await request.json();
    const parsed = updateApplicationEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const event = await updateApplicationEvent(eventId, parsed.data);
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
    const { eventId } = await params;
    await deleteApplicationEvent(eventId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2025") {
      return NextResponse.json({ success: true });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete application event" },
      { status: 500 }
    );
  }
}
