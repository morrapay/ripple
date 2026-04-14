import { prisma } from "@/lib/prisma";
import type { CreateDomainInput, UpdateDomainInput } from "@/lib/validations/domain";

export async function listDomains() {
  return prisma.domain.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDomainById(id: string) {
  return prisma.domain.findUnique({
    where: { id },
    include: { selectedService: true },
  });
}

export async function createDomain(input: CreateDomainInput) {
  return prisma.domain.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      tags: input.tags ?? [],
    },
  });
}

export async function updateDomain(id: string, input: UpdateDomainInput) {
  return prisma.domain.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.eventsManuallyConfirmed !== undefined && {
        eventsManuallyConfirmed: input.eventsManuallyConfirmed,
      }),
      ...(input.selectedServiceId !== undefined && {
        selectedServiceId: input.selectedServiceId,
      }),
      ...(input.generationContext !== undefined && {
        generationContext: input.generationContext,
      }),
    },
  });
}

export async function deleteDomain(id: string) {
  return prisma.domain.delete({
    where: { id },
  });
}
