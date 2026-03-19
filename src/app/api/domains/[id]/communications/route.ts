import { NextRequest, NextResponse } from "next/server";
import {
  listCommunications,
  createCommunication,
  listCommunicationPointsWithoutCommunication,
} from "@/lib/services/communication";
import { getDomainById } from "@/lib/services/domain";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const channel = searchParams.get("channel") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const tag = searchParams.get("tag") ?? undefined;
    const sortBy = (searchParams.get("sortBy") ?? "updatedAt") as
      | "updatedAt"
      | "name"
      | "channel"
      | "status";
    const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

    const communications = await listCommunications({
      domainId: id,
      search,
      channel,
      status: status as "DRAFT" | "ACTIVE" | "PAUSED" | "DEPRECATED" | "READY_FOR_BRAZE",
      tag,
      sortBy,
      sortOrder,
    });

    const pendingPoints = await listCommunicationPointsWithoutCommunication(id);

    return NextResponse.json({
      communications,
      pendingPoints,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch communications" },
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
    const communication = await createCommunication(id, {
      name: body.name ?? "Untitled",
      description: body.description,
      communicationPointId: body.communicationPointId,
      templateId: body.templateId,
      tags: body.tags ?? [],
      owner: body.owner,
      status: body.status,
    });

    return NextResponse.json({ communication });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create communication" },
      { status: 500 }
    );
  }
}
