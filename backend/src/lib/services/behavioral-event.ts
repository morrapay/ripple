import { prisma } from "@/lib/prisma";
import type { CreateBehavioralEventInput, UpdateBehavioralEventInput } from "@/lib/validations/behavioral-event";

export async function listBehavioralEventsByDomain(domainId: string) {
  return prisma.behavioralEvent.findMany({
    where: { domainId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createBehavioralEvent(
  domainId: string,
  input: CreateBehavioralEventInput
) {
  return prisma.behavioralEvent.create({
    data: {
      domainId,
      eventName: input.eventName,
      eventType: input.eventType,
      description: input.description ?? null,
      userProperties: (input.userProperties ?? []) as object,
      eventProperties: input.eventProperties as object,
    },
  });
}

export async function updateBehavioralEvent(
  id: string,
  domainId: string,
  input: UpdateBehavioralEventInput
) {
  const existing = await prisma.behavioralEvent.findFirst({
    where: { id, domainId },
  });
  if (!existing) return null;

  return prisma.behavioralEvent.update({
    where: { id },
    data: {
      ...(input.eventName !== undefined && { eventName: input.eventName }),
      ...(input.eventType !== undefined && { eventType: input.eventType }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.userProperties !== undefined && {
        userProperties: input.userProperties as object,
      }),
      ...(input.eventProperties !== undefined && {
        eventProperties: input.eventProperties as object,
      }),
    },
  });
}

export async function deleteBehavioralEvent(id: string, domainId: string) {
  const existing = await prisma.behavioralEvent.findFirst({
    where: { id, domainId },
  });
  if (!existing) return null;

  return prisma.behavioralEvent.delete({
    where: { id },
  });
}

export async function createBehavioralEventsBulk(
  domainId: string,
  events: CreateBehavioralEventInput[]
) {
  const existing = await prisma.behavioralEvent.findMany({
    where: { domainId },
    select: { eventName: true },
  });
  const existingNames = new Set(existing.map((e) => e.eventName));
  const newEvents = events.filter((e) => !existingNames.has(e.eventName));
  if (newEvents.length === 0) return { count: 0 };
  return prisma.behavioralEvent.createMany({
    data: newEvents.map((e) => ({
      domainId,
      eventName: e.eventName,
      eventType: e.eventType,
      description: e.description ?? null,
      userProperties: (e.userProperties ?? []) as object,
      eventProperties: e.eventProperties as object,
    })),
  });
}
