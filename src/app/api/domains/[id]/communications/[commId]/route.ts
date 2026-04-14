import { NextRequest, NextResponse } from "next/server";
import {
  getCommunicationById,
  updateCommunication,
  deleteCommunication,
} from "@/lib/services/communication";
import { getDomainById } from "@/lib/services/domain";
import { logAudit } from "@/lib/services/audit";

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
      channel: body.channel,
      communicationType: body.communicationType,
      category: body.category,
      preferenceGroup: body.preferenceGroup,
      preferenceCategories: body.preferenceCategories,
      tags: body.tags,
      owner: body.owner,
      status: body.status,
      contentOutline: body.contentOutline,
    });

    await logAudit({
      domainId: id,
      entityType: "COMMUNICATION",
      entityId: commId,
      action: "UPDATE",
      changes: body as Record<string, unknown>,
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
    await logAudit({
      domainId: id,
      entityType: "COMMUNICATION",
      entityId: commId,
      action: "DELETE",
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete communication" },
      { status: 500 }
    );
  }
}
