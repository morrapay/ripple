import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateApplicationEventInput,
  UpdateApplicationEventInput,
} from "@/lib/validations/application-event";

export async function listApplicationEventsByDomain(domainId: string) {
  return prisma.applicationEvent.findMany({
    where: { domainId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createApplicationEvent(
  domainId: string,
  input: CreateApplicationEventInput
) {
  return prisma.applicationEvent.create({
    data: {
      domainId,
      eventName: input.eventName,
      eventType: input.eventType,
      description: input.description ?? null,
      handshakeContext: (input.handshakeContext ?? {}) as object,
      ...(input.businessRationale != null && {
        businessRationale: input.businessRationale as object,
      }),
      ...(input.producerMetadata != null && {
        producerMetadata: input.producerMetadata as object,
      }),
    },
  });
}

export async function updateApplicationEvent(
  id: string,
  input: UpdateApplicationEventInput
) {
  return prisma.applicationEvent.update({
    where: { id },
    data: {
      ...(input.eventName !== undefined && { eventName: input.eventName }),
      ...(input.eventType !== undefined && { eventType: input.eventType }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.handshakeContext !== undefined && {
        handshakeContext: input.handshakeContext as object,
      }),
      ...(input.businessRationale !== undefined && {
        businessRationale:
          input.businessRationale != null
            ? (input.businessRationale as object)
            : Prisma.JsonNull,
      }),
      ...(input.producerMetadata !== undefined && {
        producerMetadata:
          input.producerMetadata != null
            ? (input.producerMetadata as object)
            : Prisma.JsonNull,
      }),
    },
  });
}

export async function deleteApplicationEvent(id: string) {
  return prisma.applicationEvent.delete({
    where: { id },
  });
}

export async function createApplicationEventsBulk(
  domainId: string,
  events: CreateApplicationEventInput[]
) {
  const existing = await prisma.applicationEvent.findMany({
    where: { domainId },
    select: { eventName: true },
  });
  const existingNames = new Set(existing.map((e) => e.eventName));
  const newEvents = events.filter((e) => !existingNames.has(e.eventName));
  if (newEvents.length === 0) return { count: 0 };
  return prisma.applicationEvent.createMany({
    data: newEvents.map((e) => ({
      domainId,
      eventName: e.eventName,
      eventType: e.eventType,
      description: e.description ?? null,
      handshakeContext: (e.handshakeContext ?? {}) as object,
      ...(e.businessRationale != null && {
        businessRationale: e.businessRationale as object,
      }),
      ...(e.producerMetadata != null && {
        producerMetadata: e.producerMetadata as object,
      }),
    })),
  });
}
