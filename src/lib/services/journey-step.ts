import { prisma } from "@/lib/prisma";

export type JourneyStepKind = "ACTION" | "SYSTEM_TRIGGER" | "COMMUNICATION" | "STATE";

export interface CreateJourneyStepInput {
  name: string;
  description?: string;
  kind: JourneyStepKind;
  journeyId?: string;
  posX?: number;
  posY?: number;
  imageUrl?: string;
  behavioralEventId?: string;
  applicationEventId?: string;
  communicationPointName?: string;
  triggerEvent?: string;
}

export interface UpdateJourneyStepInput {
  name?: string;
  description?: string;
  kind?: JourneyStepKind;
  order?: number;
  posX?: number;
  posY?: number;
  imageUrl?: string;
  behavioralEventId?: string | null;
  applicationEventId?: string | null;
  communicationPointName?: string;
  triggerEvent?: string;
}

export async function listJourneyStepsByDomain(domainId: string) {
  return prisma.journeyStep.findMany({
    where: { domainId },
    orderBy: { order: "asc" },
    include: {
      behavioralEvents: { include: { behavioralEvent: true } },
      applicationEvents: { include: { applicationEvent: true } },
      communicationPoints: true,
    },
  });
}

export async function listJourneyStepsByJourney(journeyId: string) {
  return prisma.journeyStep.findMany({
    where: { journeyId },
    orderBy: { order: "asc" },
    include: {
      behavioralEvents: { include: { behavioralEvent: true } },
      applicationEvents: { include: { applicationEvent: true } },
      communicationPoints: true,
    },
  });
}

export async function updateStepPosition(
  id: string,
  posX: number,
  posY: number
) {
  return prisma.journeyStep.update({
    where: { id },
    data: { posX, posY },
  });
}

export async function createJourneyStep(
  domainId: string,
  input: CreateJourneyStepInput
) {
  const maxOrder = await prisma.journeyStep
    .aggregate({ where: { domainId }, _max: { order: true } })
    .then((r) => r._max.order ?? -1);

  const step = await prisma.journeyStep.create({
    data: {
      domainId,
      journeyId: input.journeyId ?? null,
      order: maxOrder + 1,
      name: input.name,
      description: input.description ?? null,
      posX: input.posX ?? 0,
      posY: input.posY ?? 0,
      imageUrl: input.imageUrl ?? null,
    },
  });

  if (input.kind === "ACTION" && input.behavioralEventId) {
    await prisma.journeyStepBehavioralEvent.create({
      data: {
        journeyStepId: step.id,
        behavioralEventId: input.behavioralEventId,
      },
    });
  }

  if (input.kind === "SYSTEM_TRIGGER" && input.applicationEventId) {
    await prisma.journeyStepApplicationEvent.create({
      data: {
        journeyStepId: step.id,
        applicationEventId: input.applicationEventId,
      },
    });
  }

  if (input.kind === "COMMUNICATION" && input.communicationPointName) {
    await prisma.communicationPoint.create({
      data: {
        domainId,
        journeyStepId: step.id,
        name: input.communicationPointName,
        triggerEvent: input.triggerEvent ?? null,
      },
    });
  }

  return listJourneyStepsByDomain(domainId);
}

export async function updateJourneyStep(
  id: string,
  domainId: string,
  input: UpdateJourneyStepInput
) {
  const step = await prisma.journeyStep.findFirst({
    where: { id, domainId },
    include: { communicationPoints: true },
  });
  if (!step) return null;

  if (input.order !== undefined) {
    const steps = await prisma.journeyStep.findMany({
      where: { domainId },
      orderBy: { order: "asc" },
    });
    const fromIdx = steps.findIndex((s) => s.id === id);
    if (fromIdx >= 0 && fromIdx !== input.order) {
      const toIdx = Math.min(Math.max(0, input.order), steps.length - 1);
      const stepIds = steps.map((s) => s.id);
      const [moved] = stepIds.splice(fromIdx, 1);
      stepIds.splice(toIdx, 0, moved);
      await Promise.all(
        stepIds.map((sid, i) =>
          prisma.journeyStep.update({
            where: { id: sid },
            data: { order: i },
          })
        )
      );
    }
  }

  await prisma.journeyStep.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.posX !== undefined && { posX: input.posX }),
      ...(input.posY !== undefined && { posY: input.posY }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
    },
  });

  // When kind changes, clear all junction tables first, then recreate for the new kind
  if (input.behavioralEventId !== undefined) {
    await prisma.journeyStepBehavioralEvent.deleteMany({
      where: { journeyStepId: id },
    });
    if (input.behavioralEventId) {
      await prisma.journeyStepBehavioralEvent.create({
        data: {
          journeyStepId: id,
          behavioralEventId: input.behavioralEventId,
        },
      });
    }
  }

  if (input.applicationEventId !== undefined) {
    await prisma.journeyStepApplicationEvent.deleteMany({
      where: { journeyStepId: id },
    });
    if (input.applicationEventId) {
      await prisma.journeyStepApplicationEvent.create({
        data: {
          journeyStepId: id,
          applicationEventId: input.applicationEventId,
        },
      });
    }
  }

  if (input.kind && input.kind !== "COMMUNICATION") {
    // Switching away from COMMUNICATION — remove any linked communication points
    await prisma.communicationPoint.deleteMany({
      where: { journeyStepId: id },
    });
  } else if (
    input.kind === "COMMUNICATION" &&
    (input.communicationPointName !== undefined || input.triggerEvent !== undefined)
  ) {
    const cp = step.communicationPoints[0];
    if (cp) {
      await prisma.communicationPoint.update({
        where: { id: cp.id },
        data: {
          ...(input.communicationPointName !== undefined && {
            name: input.communicationPointName,
          }),
          ...(input.triggerEvent !== undefined && {
            triggerEvent: input.triggerEvent,
          }),
        },
      });
    } else if (input.communicationPointName) {
      await prisma.communicationPoint.create({
        data: {
          domainId,
          journeyStepId: id,
          name: input.communicationPointName,
          triggerEvent: input.triggerEvent ?? null,
        },
      });
    }
  }

  return listJourneyStepsByDomain(domainId);
}

export async function deleteJourneyStep(id: string, domainId: string) {
  const steps = await prisma.journeyStep.findMany({
    where: { domainId },
    orderBy: { order: "asc" },
  });
  const idx = steps.findIndex((s) => s.id === id);
  if (idx < 0) return null;

  await prisma.journeyStep.delete({ where: { id } });

  for (let i = idx + 1; i < steps.length; i++) {
    await prisma.journeyStep.update({
      where: { id: steps[i].id },
      data: { order: i - 1 },
    });
  }

  return listJourneyStepsByDomain(domainId);
}
