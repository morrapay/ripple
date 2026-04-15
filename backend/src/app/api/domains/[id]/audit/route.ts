import { NextRequest, NextResponse } from "next/server";
import type { AuditEntityType } from "@prisma/client";
import { getAuditLog, getDomainAuditLog } from "@/lib/services/audit";
import { getDomainById } from "@/lib/services/domain";

const ENTITY_TYPES = new Set<AuditEntityType>([
  "JOURNEY",
  "STEP",
  "COMMUNICATION",
  "BEHAVIORAL_EVENT",
  "APPLICATION_EVENT",
  "COMMUNICATION_POINT",
  "PREFERENCE_CATEGORY",
]);

function parseEntityType(value: string | null): AuditEntityType | null {
  if (!value) return null;
  if (ENTITY_TYPES.has(value as AuditEntityType)) {
    return value as AuditEntityType;
  }
  return null;
}

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
    const entityTypeParam = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const limitRaw = searchParams.get("limit");
    const offsetRaw = searchParams.get("offset");
    const parsedLimit =
      limitRaw != null ? parseInt(limitRaw, 10) : Number.NaN;
    const parsedOffset =
      offsetRaw != null ? parseInt(offsetRaw, 10) : Number.NaN;
    const limit = Number.isNaN(parsedLimit)
      ? 50
      : Math.min(100, Math.max(1, parsedLimit));
    const offset = Number.isNaN(parsedOffset)
      ? 0
      : Math.max(0, parsedOffset);

    if (entityTypeParam && entityId) {
      const entityType = parseEntityType(entityTypeParam);
      if (!entityType) {
        return NextResponse.json(
          { error: "Invalid entityType" },
          { status: 400 }
        );
      }
      const logs = await getAuditLog(entityType, entityId, { limit, offset });
      return NextResponse.json({ logs });
    }

    let entityTypeFilter: AuditEntityType | undefined;
    if (entityTypeParam) {
      const parsed = parseEntityType(entityTypeParam);
      if (!parsed) {
        return NextResponse.json(
          { error: "Invalid entityType" },
          { status: 400 }
        );
      }
      entityTypeFilter = parsed;
    }

    const logs = await getDomainAuditLog(id, {
      limit,
      offset,
      entityType: entityTypeFilter,
    });
    return NextResponse.json({ logs });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch audit log" },
      { status: 500 }
    );
  }
}
