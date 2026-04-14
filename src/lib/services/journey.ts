import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function listJourneysByDomain(domainId: string) {
  return prisma.journey.findMany({
    where: { domainId },
    orderBy: { updatedAt: "desc" },
    include: {
      steps: {
        select: {
          id: true,
          behavioralEvents: { select: { behavioralEventId: true } },
          applicationEvents: { select: { applicationEventId: true } },
          communicationPoints: { select: { id: true } },
        },
      },
    },
  });
}

export async function getJourneyById(id: string, domainId: string) {
  return prisma.journey.findFirst({
    where: { id, domainId },
    include: {
      steps: {
        orderBy: { order: "asc" },
        include: {
          behavioralEvents: { include: { behavioralEvent: true } },
          applicationEvents: { include: { applicationEvent: true } },
          communicationPoints: true,
        },
      },
    },
  });
}

export async function createJourney(
  domainId: string,
  input: { name: string; description?: string; audience?: string; objective?: string }
) {
  return prisma.journey.create({
    data: {
      domainId,
      name: input.name,
      description: input.description ?? null,
      audience: input.audience ?? null,
      objective: input.objective ?? null,
    },
  });
}

export async function updateJourney(
  id: string,
  domainId: string,
  input: {
    name?: string;
    description?: string;
    audience?: string;
    objective?: string;
    coverImage?: string;
    entryCriteria?: Record<string, unknown>;
    exitCriteria?: Record<string, unknown>;
  }
) {
  const journey = await prisma.journey.findFirst({ where: { id, domainId } });
  if (!journey) return null;

  return prisma.journey.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.audience !== undefined && { audience: input.audience }),
      ...(input.objective !== undefined && { objective: input.objective }),
      ...(input.coverImage !== undefined && { coverImage: input.coverImage }),
      ...(input.entryCriteria !== undefined && { entryCriteria: input.entryCriteria as Prisma.InputJsonValue }),
      ...(input.exitCriteria !== undefined && { exitCriteria: input.exitCriteria as Prisma.InputJsonValue }),
    },
  });
}

export async function deleteJourney(id: string, domainId: string) {
  const journey = await prisma.journey.findFirst({ where: { id, domainId } });
  if (!journey) return null;

  await prisma.journeyStep.deleteMany({ where: { journeyId: id } });
  await prisma.journey.delete({ where: { id } });
  return { deleted: true };
}

export async function splitJourney(
  journeyId: string,
  domainId: string,
  splitAtStepId: string
) {
  const journey = await prisma.journey.findFirst({
    where: { id: journeyId, domainId },
    include: {
      steps: {
        orderBy: { order: "asc" },
        include: {
          behavioralEvents: { include: { behavioralEvent: true } },
          applicationEvents: { include: { applicationEvent: true } },
          communicationPoints: true,
        },
      },
    },
  });
  if (!journey) return null;

  const splitIdx = journey.steps.findIndex((s) => s.id === splitAtStepId);
  if (splitIdx < 0) return null;

  const stepsToMove = journey.steps.slice(splitIdx);

  const newJourney = await prisma.journey.create({
    data: {
      domainId,
      name: `${journey.name} (continued)`,
      description: journey.description,
    },
  });

  for (let i = 0; i < stepsToMove.length; i++) {
    const step = stepsToMove[i];
    await prisma.journeyStep.update({
      where: { id: step.id },
      data: {
        journeyId: newJourney.id,
        order: i,
        posX: i * 280,
        posY: 0,
      },
    });
  }

  return {
    originalJourneyId: journeyId,
    newJourney: await getJourneyById(newJourney.id, domainId),
  };
}
