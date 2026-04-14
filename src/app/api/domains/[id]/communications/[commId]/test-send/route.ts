import { NextRequest, NextResponse } from "next/server";
import { getCommunicationById } from "@/lib/services/communication";
import { getDomainById } from "@/lib/services/domain";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commId: string }> }
) {
  try {
    const { id, commId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const recipientEmail = body.recipientEmail as string | undefined;

    if (!recipientEmail || typeof recipientEmail !== "string") {
      return NextResponse.json(
        { error: "recipientEmail is required" },
        { status: 400 }
      );
    }

    const communication = await getCommunicationById(commId, id);
    if (!communication) {
      return NextResponse.json(
        { error: "Communication not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email queued for ${recipientEmail}`,
      previewUrl: null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to queue test send" },
      { status: 500 }
    );
  }
}
