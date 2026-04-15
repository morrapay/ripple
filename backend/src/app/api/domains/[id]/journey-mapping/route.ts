import { NextRequest, NextResponse } from "next/server";
import { getDomainById } from "@/lib/services/domain";
import { listFlowsByDomain } from "@/lib/services/flow";
import { createJourneyStep, type JourneyStepKind } from "@/lib/services/journey-step";
import { createJourney, getJourneyById } from "@/lib/services/journey";
import { EventToJourneyMapper } from "@/lib/ai/event-to-journey-mapper";
import type { LearningMode } from "@/lib/ai/journey-mapper-types";
import { prisma } from "@/lib/prisma";

const NODE_SPACING_X = 280;
const KIND_ROW_OFFSET: Record<string, number> = {
  ACTION: 0,
  SYSTEM_TRIGGER: 160,
  COMMUNICATION: 320,
  STATE: 480,
};

/**
 * POST /api/domains/[id]/journey-mapping
 * Uses the EventToJourneyMapper agent to intelligently map events into
 * journeys with classification, confidence scoring, and learning.
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

    const body = await request.json().catch(() => ({}));
    const learningMode: LearningMode = body.learningMode ?? "ACTIVE";

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

    if (behavioralEvents.length === 0 && applicationEvents.length === 0) {
      return NextResponse.json(
        {
          error:
            "No events to map. Add behavioral or application events in the Data Layer first.",
        },
        { status: 400 }
      );
    }

    const output = await EventToJourneyMapper.mapEventsToJourney(
      {
        flows: flows.map((f) => ({
          id: f.id,
          name: f.name,
          flowType: f.flowType,
        })),
        behavioralEvents,
        applicationEvents,
        learningMode,
      },
      domainId
    );

    const { primaryJourney } = output;

    if (primaryJourney.steps.length === 0) {
      return NextResponse.json(
        { error: "No steps could be mapped from the available events." },
        { status: 400 }
      );
    }

    // Create the journey record
    const journey = await createJourney(domainId, {
      name: primaryJourney.name,
      description: primaryJourney.description,
    });

    // Create steps with auto-positioning
    for (const step of primaryJourney.steps) {
      const yOffset = KIND_ROW_OFFSET[step.kind] ?? 0;
      await createJourneyStep(domainId, {
        name: step.name,
        description: step.description,
        kind: step.kind as JourneyStepKind,
        journeyId: journey.id,
        posX: step.order * NODE_SPACING_X,
        posY: yOffset,
        behavioralEventId: step.behavioralEventId,
        applicationEventId: step.applicationEvents[0]?.eventId,
        communicationPointName: step.communicationPointName,
        triggerEvent: step.triggerEvent,
      });
    }

    const fullJourney = await getJourneyById(journey.id, domainId);

    return NextResponse.json({
      journey: fullJourney,
      analysis: {
        classifiedEvents: output.classifiedEvents,
        gaps: output.gaps,
        alternativeJourneys: output.alternativeJourneys.map((j) => ({
          name: j.name,
          description: j.description,
          stepCount: j.steps.length,
          flowType: j.flowType,
        })),
        learnedInsightsApplied: output.learnedInsightsApplied,
        newLearnings: output.newLearnings,
        conflictsDetected: output.conflictsDetected,
        driftSignals: output.driftSignals,
        flowType: primaryJourney.flowType,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to map journey" },
      { status: 500 }
    );
  }
}
