import { NextRequest, NextResponse } from "next/server";
import {
  updateChannelGovernance,
  deleteChannelGovernance,
} from "@/lib/services/channel-governance";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const rule = await updateChannelGovernance(id, {
      channelId: body.channelId,
      title: body.title,
      content: body.content,
      category: body.category,
      order: body.order,
    });
    return NextResponse.json({ rule });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update governance rule" },
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
    await deleteChannelGovernance(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete governance rule" },
      { status: 500 }
    );
  }
}
