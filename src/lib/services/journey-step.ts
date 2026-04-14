import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type JourneyStepKind = "ACTION" | "SYSTEM_TRIGGER" | "COMMUNICATION" | "STATE" | "DECISION" | "WAIT_DELAY" | "AB_SPLIT";

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
  insertAfterOrder?: number;
}

export interface UpdateJourneyStepInput {
  name?: string;
  description?: string;
  kind?: string;
  order?: number;
  posX?: number;
  posY?: number;
  imageUrl?: string;
  behavioralEventId?: string | null;
  applicationEventId?: string | null;
  communicationPointName?: string;
  triggerEvent?: string;
  conditionConfig?: Record<string, unknown>;
  waitDuration?: string;
  splitVariants?: { name: string; percentage: number }[];
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
  let newOrder: number;

  if (input.insertAfterOrder !== undefined) {
    await prisma.journeyStep.updateMany({
      where: { domainId, order: { gt: input.insertAfterOrder } },
      data: { order: { increment: 1 } },
    });
    newOrder = input.insertAfterOrder + 1;
  } else {
    const maxOrder = await prisma.journeyStep
      .aggregate({ where: { domainId }, _max: { order: true } })
      .then((r) => r._max.order ?? -1);
    newOrder = maxOrder + 1;
  }

  const step = await prisma.journeyStep.create({
    data: {
      domainId,
      journeyId: input.journeyId ?? null,
      order: newOrder,
      name: input.name,
      description: input.description ?? null,
      kind: input.kind ?? "STATE",
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
    const cp = await prisma.communicationPoint.create({
      data: {
        domainId,
        journeyStepId: step.id,
        name: input.communicationPointName,
        triggerEvent: input.triggerEvent ?? null,
      },
    });
    await prisma.communication.create({
      data: {
        domainId,
        communicationPointId: cp.id,
        name: input.communicationPointName,
        status: "DRAFT",
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
      ...(input.kind !== undefined && { kind: input.kind }),
      ...(input.posX !== undefined && { posX: input.posX }),
      ...(input.posY !== undefined && { posY: input.posY }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.conditionConfig !== undefined && { conditionConfig: input.conditionConfig as unknown as Prisma.InputJsonValue }),
      ...(input.waitDuration !== undefined && { waitDuration: input.waitDuration }),
      ...(input.splitVariants !== undefined && { splitVariants: input.splitVariants as unknown as Prisma.InputJsonValue }),
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
    const pointsToRemove = await prisma.communicationPoint.findMany({
      where: { journeyStepId: id },
      select: { id: true },
    });
    if (pointsToRemove.length > 0) {
      await prisma.communication.deleteMany({
        where: { communicationPointId: { in: pointsToRemove.map((p) => p.id) } },
      });
      await prisma.communicationPoint.deleteMany({
        where: { journeyStepId: id },
      });
    }
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
      const newCp = await prisma.communicationPoint.create({
        data: {
          domainId,
          journeyStepId: id,
          name: input.communicationPointName,
          triggerEvent: input.triggerEvent ?? null,
        },
      });
      await prisma.communication.create({
        data: {
          domainId,
          communicationPointId: newCp.id,
          name: input.communicationPointName,
          status: "DRAFT",
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

  // Explicitly remove child records to avoid FK constraint issues
  await prisma.journeyStepBehavioralEvent.deleteMany({ where: { journeyStepId: id } });
  await prisma.journeyStepApplicationEvent.deleteMany({ where: { journeyStepId: id } });

  const points = await prisma.communicationPoint.findMany({
    where: { journeyStepId: id },
    select: { id: true },
  });
  if (points.length > 0) {
    const pointIds = points.map((p) => p.id);
    await prisma.communication.deleteMany({ where: { communicationPointId: { in: pointIds } } });
    await prisma.communicationPoint.deleteMany({ where: { journeyStepId: id } });
  }

  await prisma.journeyStep.delete({ where: { id } });

  for (let i = idx + 1; i < steps.length; i++) {
    await prisma.journeyStep.update({
      where: { id: steps[i].id },
      data: { order: i - 1 },
    });
  }

  return listJourneyStepsByDomain(domainId);
}
