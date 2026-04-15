import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type CommunicationStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "DEPRECATED"
  | "READY_FOR_BRAZE";

export interface ListCommunicationsInput {
  domainId: string;
  search?: string;
  channel?: string;
  status?: CommunicationStatus;
  tag?: string;
  sortBy?: "updatedAt" | "name" | "channel" | "status";
  sortOrder?: "asc" | "desc";
}

export type CommunicationType = "PROMOTIONAL" | "TRANSACTIONAL" | "OPERATIONAL";

export interface CreateCommunicationInput {
  name: string;
  description?: string;
  communicationPointId?: string;
  templateId?: string;
  channel?: string;
  communicationType?: CommunicationType;
  category?: string;
  preferenceGroup?: string;
  tags?: string[];
  owner?: string;
  status?: CommunicationStatus;
}

export interface UpdateCommunicationInput {
  name?: string;
  description?: string;
  templateId?: string;
  channel?: string;
  communicationType?: CommunicationType | null;
  category?: string | null;
  preferenceGroup?: string | null;
  preferenceCategories?: string[];
  tags?: string[];
  owner?: string;
  status?: CommunicationStatus;
  contentOutline?: object;
}

export async function listCommunications(input: ListCommunicationsInput) {
  const {
    domainId,
    search,
    channel,
    status,
    tag,
    sortBy = "updatedAt",
    sortOrder = "desc",
  } = input;

  const where: Prisma.CommunicationWhereInput = { domainId };

  if (search?.trim()) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
      {
        communicationPoint: {
          triggerEvent: { contains: search, mode: "insensitive" },
        },
      },
      {
        template: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { channel: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  if (channel) {
    where.channel = { equals: channel, mode: "insensitive" };
  }

  if (status) {
    where.status = status;
  }

  if (tag) {
    where.tags = { has: tag };
  }

  const orderBy: Prisma.CommunicationOrderByWithRelationInput =
    sortBy === "channel"
      ? { template: { channel: sortOrder } }
      : sortBy === "name"
        ? { name: sortOrder }
        : sortBy === "status"
          ? { status: sortOrder }
          : { updatedAt: sortOrder };

  const communications = await prisma.communication.findMany({
    where,
    include: {
      domain: { select: { id: true, name: true } },
      communicationPoint: true,
      template: true,
    },
    orderBy,
  });

  return communications;
}

export async function listCommunicationPointsWithoutCommunication(
  domainId: string
) {
  return prisma.communicationPoint.findMany({
    where: {
      domainId,
      communication: null,
    },
    include: { journeyStep: true },
  });
}

export async function getCommunicationById(id: string, domainId: string) {
  return prisma.communication.findFirst({
    where: { id, domainId },
    include: {
      domain: true,
      communicationPoint: { include: { journeyStep: true } },
      template: true,
    },
  });
}

export async function createCommunication(
  domainId: string,
  input: CreateCommunicationInput
) {
  return prisma.communication.create({
    data: {
      domainId,
      name: input.name,
      description: input.description ?? null,
      communicationPointId: input.communicationPointId ?? null,
      templateId: input.templateId ?? null,
      channel: input.channel ?? null,
      communicationType: input.communicationType ?? null,
      category: input.category ?? null,
      preferenceGroup: input.preferenceGroup ?? null,
      tags: input.tags ?? [],
      owner: input.owner ?? null,
      status: (input.status ?? "DRAFT") as "DRAFT" | "ACTIVE" | "PAUSED" | "DEPRECATED" | "READY_FOR_BRAZE",
    },
    include: {
      domain: { select: { id: true, name: true } },
      communicationPoint: true,
      template: true,
    },
  });
}

export async function updateCommunication(
  id: string,
  domainId: string,
  input: UpdateCommunicationInput
) {
  const existing = await prisma.communication.findFirst({
    where: { id, domainId },
  });
  if (!existing) return null;

  return prisma.communication.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.templateId !== undefined && { templateId: input.templateId }),
      ...(input.channel !== undefined && { channel: input.channel }),
      ...(input.communicationType !== undefined && { communicationType: input.communicationType }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.preferenceGroup !== undefined && { preferenceGroup: input.preferenceGroup }),
      ...(input.preferenceCategories !== undefined && { preferenceCategories: input.preferenceCategories }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.owner !== undefined && { owner: input.owner }),
      ...(input.status !== undefined && {
        status: input.status as "DRAFT" | "ACTIVE" | "PAUSED" | "DEPRECATED" | "READY_FOR_BRAZE",
      }),
      ...(input.contentOutline !== undefined && {
        contentOutline: input.contentOutline as object,
      }),
    },
    include: {
      domain: { select: { id: true, name: true } },
      communicationPoint: true,
      template: true,
    },
  });
}

export async function deleteCommunication(id: string, domainId: string) {
  const existing = await prisma.communication.findFirst({
    where: { id, domainId },
  });
  if (!existing) return null;

  return prisma.communication.delete({
    where: { id },
  });
}

export async function listTemplates() {
  return prisma.communicationTemplate.findMany({
    orderBy: [{ channel: "asc" }, { name: "asc" }],
  });
}
