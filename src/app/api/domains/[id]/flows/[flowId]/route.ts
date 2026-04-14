import { NextRequest, NextResponse } from "next/server";
import { deleteFlow } from "@/lib/services/flow";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { id, flowId } = await params;
    const deleted = await deleteFlow(flowId, id);
    if (!deleted) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete flow" },
      { status: 500 }
    );
  }
}
