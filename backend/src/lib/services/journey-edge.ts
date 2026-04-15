import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const stepNameSelect = { id: true, name: true } as const;

export async function listEdgesByJourney(journeyId: string) {
  return prisma.journeyEdge.findMany({
    where: { journeyId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: {
      sourceStep: { select: stepNameSelect },
      targetStep: { select: stepNameSelect },
    },
  });
}

export type CreateEdgeInput = {
  journeyId: string;
  sourceStepId: string;
  targetStepId: string;
  label?: string | null;
  condition?: Prisma.InputJsonValue | null;
  sortOrder?: number;
};

export async function createEdge(data: CreateEdgeInput) {
  const [source, target] = await Promise.all([
    prisma.journeyStep.findFirst({
      where: { id: data.sourceStepId, journeyId: data.journeyId },
    }),
    prisma.journeyStep.findFirst({
      where: { id: data.targetStepId, journeyId: data.journeyId },
    }),
  ]);

  if (!source || !target) {
    return null;
  }

  return prisma.journeyEdge.create({
    data: {
      journeyId: data.journeyId,
      sourceStepId: data.sourceStepId,
      targetStepId: data.targetStepId,
      label: data.label ?? null,
      sortOrder: data.sortOrder ?? 0,
      ...(data.condition !== undefined && {
        condition: data.condition as Prisma.InputJsonValue,
      }),
    },
    include: {
      sourceStep: { select: stepNameSelect },
      targetStep: { select: stepNameSelect },
    },
  });
}

export async function deleteEdge(id: string) {
  return prisma.journeyEdge.delete({
    where: { id },
  });
}

/**
 * When a journey has ordered steps but no explicit edges yet, link consecutive
 * steps (by `order`) so legacy flows remain navigable.
 */
export async function syncEdgesFromOrder(journeyId: string, domainId: string) {
  const journey = await prisma.journey.findFirst({
    where: { id: journeyId, domainId },
    include: {
      edges: { select: { id: true } },
      steps: { orderBy: { order: "asc" }, select: { id: true } },
    },
  });

  if (!journey) {
    return { created: 0, skipped: true as const };
  }

  if (journey.edges.length > 0) {
    return { created: 0, skipped: true as const };
  }

  const steps = journey.steps;
  if (steps.length < 2) {
    return { created: 0, skipped: false as const };
  }

  await prisma.$transaction(
    steps.slice(0, -1).map((step, i) =>
      prisma.journeyEdge.create({
        data: {
          journeyId,
          sourceStepId: step.id,
          targetStepId: steps[i + 1]!.id,
          sortOrder: i,
        },
      })
    )
  );

  return { created: steps.length - 1, skipped: false as const };
}
