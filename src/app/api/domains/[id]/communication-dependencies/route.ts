import { NextRequest, NextResponse } from "next/server";
import { DependencyType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDomainById } from "@/lib/services/domain";

const COMM_SELECT = {
  id: true,
  name: true,
  channel: true,
  status: true,
} as const;

const DEPENDENCY_INCLUDE = {
  fromCommunication: { select: COMM_SELECT },
  toCommunication: { select: COMM_SELECT },
} as const;

const VALID_TYPES: DependencyType[] = [
  DependencyType.MUST_PRECEDE,
  DependencyType.MUTUALLY_EXCLUSIVE,
  DependencyType.TRIGGERS,
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const dependencies = await prisma.communicationDependency.findMany({
      where: { domainId: id },
      orderBy: { createdAt: "asc" },
      include: DEPENDENCY_INCLUDE,
    });

    return NextResponse.json({ dependencies });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch communication dependencies" },
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
    const fromCommunicationId = body.fromCommunicationId as string | undefined;
    const toCommunicationId = body.toCommunicationId as string | undefined;
    const typeRaw = body.type as string | undefined;

    if (!fromCommunicationId || !toCommunicationId) {
      return NextResponse.json(
        { error: "fromCommunicationId and toCommunicationId are required" },
        { status: 400 }
      );
    }

    if (!typeRaw || !VALID_TYPES.includes(typeRaw as DependencyType)) {
      return NextResponse.json(
        {
          error: `type must be one of: ${VALID_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const type = typeRaw as DependencyType;

    if (fromCommunicationId === toCommunicationId) {
      return NextResponse.json(
        { error: "from and to communications must differ" },
        { status: 400 }
      );
    }

    const [fromComm, toComm] = await Promise.all([
      prisma.communication.findFirst({
        where: { id: fromCommunicationId, domainId: id },
      }),
      prisma.communication.findFirst({
        where: { id: toCommunicationId, domainId: id },
      }),
    ]);

    if (!fromComm || !toComm) {
      return NextResponse.json(
        { error: "One or both communications were not found in this domain" },
        { status: 404 }
      );
    }

    try {
      const dependency = await prisma.communicationDependency.create({
        data: {
          domainId: id,
          fromCommunicationId,
          toCommunicationId,
          type,
        },
        include: DEPENDENCY_INCLUDE,
      });

      return NextResponse.json({ dependency });
    } catch (createErr: unknown) {
      if (
        typeof createErr === "object" &&
        createErr !== null &&
        "code" in createErr &&
        (createErr as { code?: string }).code === "P2002"
      ) {
        return NextResponse.json(
          { error: "A dependency between these communications already exists" },
          { status: 409 }
        );
      }
      throw createErr;
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create communication dependency" },
      { status: 500 }
    );
  }
}
