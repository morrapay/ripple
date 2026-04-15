import { NextRequest, NextResponse } from "next/server";
import { getDomainById } from "@/lib/services/domain";
import { listFlowsByDomain } from "@/lib/services/flow";
import { createJourneyStep } from "@/lib/services/journey-step";
import { mapFlowToJourneySteps } from "@/lib/ai/flow-mapper";
import { createJourney, getJourneyById } from "@/lib/services/journey";
import { prisma } from "@/lib/prisma";

const NODE_SPACING_X = 280;
const KIND_ROW_OFFSET: Record<string, number> = {
  ACTION: 0,
  SYSTEM_TRIGGER: 160,
  COMMUNICATION: 320,
  STATE: 480,
};

/**
 * POST /api/domains/[id]/flow-mapping
 * Maps flows + events into a new Journey with auto-positioned React Flow nodes.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: domainId } = await params;
    const domain = await getDomainById(domainId);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const [flows, behavioralEvents, applicationEvents] = await Promise.all([
      listFlowsByDomain(domainId),
      prisma.behavioralEvent.findMany({
        where: { domainId },
        select: {
          id: true,
          eventName: true,
          eventType: true,
          description: true,
        },
      }),
      prisma.applicationEvent.findMany({
        where: { domainId },
        select: {
          id: true,
          eventName: true,
          eventType: true,
          description: true,
        },
      }),
    ]);

    const mapping = mapFlowToJourneySteps({
      flows: flows.map((f) => ({
        id: f.id,
        name: f.name,
        flowType: f.flowType,
      })),
      behavioralEvents,
      applicationEvents,
    });

    if (mapping.steps.length === 0) {
      return NextResponse.json(
        {
          error:
            "No events to map. Add behavioral or application events in the Data Layer first.",
        },
        { status: 400 }
      );
    }

    const flowNames = flows.map((f) => f.name);
    const journeyName =
      flowNames.length > 0
        ? `${flowNames.slice(0, 3).join(" → ")}${flowNames.length > 3 ? " ..." : ""} Journey`
        : `${domain.name} Journey`;

    const journey = await createJourney(domainId, {
      name: journeyName,
      description: `Auto-generated from ${mapping.steps.length} events across ${flows.length} screen(s).`,
    });

    for (const step of mapping.steps) {
      const yOffset = KIND_ROW_OFFSET[step.kind] ?? 0;
      await createJourneyStep(domainId, {
        name: step.name,
        description: step.description,
        kind: step.kind,
        journeyId: journey.id,
        posX: step.order * NODE_SPACING_X,
        posY: yOffset,
        behavioralEventId: step.behavioralEventId,
        applicationEventId: step.applicationEventId,
        communicationPointName: step.communicationPointName,
        triggerEvent: step.triggerEvent,
      });
    }

    const fullJourney = await getJourneyById(journey.id, domainId);

    return NextResponse.json({
      journey: fullJourney,
      summary: mapping.summary,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to map flow" },
      { status: 500 }
    );
  }
}
