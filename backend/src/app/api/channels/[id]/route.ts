import { NextRequest, NextResponse } from "next/server";
import {
  updateChannel,
  deleteChannel,
} from "@/lib/services/channel";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const channel = await updateChannel(id, {
      name: body.name,
      type: body.type,
      brazeAvailability: body.brazeAvailability,
      regionAvailability: body.regionAvailability,
      useCase: body.useCase,
      description: body.description,
    });
    return NextResponse.json({ channel });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update channel" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteChannel(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete channel" },
      { status: 500 }
    );
  }
}
