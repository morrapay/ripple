import { prisma } from "@/lib/prisma";

export interface DomainProgress {
  figmaFlowsTotal: number;
  figmaFlowsHappy: number;
  figmaFlowsUnhappy: number;
  behavioralEventsTotal: number;
  behavioralEventsDraft: number;
  behavioralEventsReady: number;
  behavioralEventsApproved: number;
  applicationEventsTotal: number;
  applicationEventsDraft: number;
  applicationEventsReady: number;
  applicationEventsApproved: number;
  journeyStepsCount: number;
  communicationPointsCount: number;
  communicationsReadyForBraze: number;
  canProceedToMapping: boolean;
}

export async function getDomainProgress(domainId: string): Promise<DomainProgress> {
  const [
    domain,
    flows,
    behavioralEvents,
    applicationEvents,
    journeySteps,
    communicationPoints,
    communications,
  ] = await Promise.all([
    prisma.domain.findUnique({ where: { id: domainId } }),
    prisma.flow.findMany({ where: { domainId } }),
    prisma.behavioralEvent.findMany({ where: { domainId } }),
    prisma.applicationEvent.findMany({ where: { domainId } }),
    prisma.journeyStep.findMany({ where: { domainId } }),
    prisma.communicationPoint.findMany({ where: { domainId } }),
    prisma.communication.findMany({
      where: { domainId, status: "READY_FOR_BRAZE" },
    }),
  ]);

  const happyFlows = flows.filter((f: { flowType: string }) => f.flowType === "HAPPY_FLOW").length;
  const unhappyFlows = flows.filter((f: { flowType: string }) => f.flowType === "UNHAPPY_FLOW").length;

  const behavioralByStatus = {
    DRAFT: behavioralEvents.filter((e: { status: string }) => e.status === "DRAFT").length,
    READY: behavioralEvents.filter((e: { status: string }) => e.status === "READY").length,
    APPROVED: behavioralEvents.filter((e: { status: string }) => e.status === "APPROVED").length,
  };

  const applicationByStatus = {
    DRAFT: applicationEvents.filter((e: { status: string }) => e.status === "DRAFT").length,
    READY: applicationEvents.filter((e: { status: string }) => e.status === "READY").length,
    APPROVED: applicationEvents.filter((e: { status: string }) => e.status === "APPROVED").length,
  };

  const hasRequiredFlows = happyFlows >= 1 && unhappyFlows >= 1;
  const hasRequiredEvents =
    behavioralEvents.length > 0 || applicationEvents.length > 0;
  const eventsManuallyConfirmed = domain?.eventsManuallyConfirmed ?? false;
  const canProceedToMapping =
    (hasRequiredFlows && hasRequiredEvents) || eventsManuallyConfirmed;

  return {
    figmaFlowsTotal: flows.length,
    figmaFlowsHappy: happyFlows,
    figmaFlowsUnhappy: unhappyFlows,
    behavioralEventsTotal: behavioralEvents.length,
    behavioralEventsDraft: behavioralByStatus.DRAFT,
    behavioralEventsReady: behavioralByStatus.READY,
    behavioralEventsApproved: behavioralByStatus.APPROVED,
    applicationEventsTotal: applicationEvents.length,
    applicationEventsDraft: applicationByStatus.DRAFT,
    applicationEventsReady: applicationByStatus.READY,
    applicationEventsApproved: applicationByStatus.APPROVED,
    journeyStepsCount: journeySteps.length,
    communicationPointsCount: communicationPoints.length,
    communicationsReadyForBraze: communications.length,
    canProceedToMapping,
  };
}
