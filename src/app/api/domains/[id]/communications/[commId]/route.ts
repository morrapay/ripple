import { NextRequest, NextResponse } from "next/server";
import {
  getCommunicationById,
  updateCommunication,
  deleteCommunication,
} from "@/lib/services/communication";
import { getDomainById } from "@/lib/services/domain";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commId: string }> }
) {
  try {
    const { id, commId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const communication = await getCommunicationById(commId, id);
    if (!communication) {
      return NextResponse.json(
        { error: "Communication not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ communication });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch communication" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commId: string }> }
) {
  try {
    const { id, commId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const body = await request.json();
    const communication = await updateCommunication(commId, id, {
      name: body.name,
      description: body.description,
      templateId: body.templateId,
      tags: body.tags,
      owner: body.owner,
      status: body.status,
      contentOutline: body.contentOutline,
    });

    return NextResponse.json({ communication });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update communication" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commId: string }> }
) {
  try {
    const { id, commId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    await deleteCommunication(commId, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete communication" },
      { status: 500 }
    );
  }
}
