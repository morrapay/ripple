import { prisma } from "@/lib/prisma";
import type { CreateFlowInput } from "@/lib/validations/flow";

export async function listFlowsByDomain(domainId: string) {
  return prisma.flow.findMany({
    where: { domainId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createFlow(domainId: string, input: CreateFlowInput) {
  return prisma.flow.create({
    data: {
      domainId,
      name: input.name,
      flowType: input.flowType,
      fileUrl: input.fileUrl ?? null,
      figmaLink: input.figmaLink ?? null,
    },
  });
}

export async function deleteFlow(id: string, domainId: string) {
  const existing = await prisma.flow.findFirst({ where: { id, domainId } });
  if (!existing) return null;

  return prisma.flow.delete({
    where: { id },
  });
}

export async function createFlowsBulk(
  domainId: string,
  flows: { name: string; flowType: "HAPPY_FLOW" | "UNHAPPY_FLOW"; figmaLink: string }[]
) {
  await prisma.flow.createMany({
    data: flows.map((f) => ({
      domainId,
      name: f.name,
      flowType: f.flowType,
      figmaLink: f.figmaLink,
    })),
  });
  return listFlowsByDomain(domainId);
}
