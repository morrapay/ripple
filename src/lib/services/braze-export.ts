import { prisma } from "@/lib/prisma";

export async function generateBrazeExport(domainId: string) {
  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    select: { id: true, name: true },
  });

  const communications = await prisma.communication.findMany({
    where: { domainId },
    include: {
      communicationPoint: { select: { triggerEvent: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const mapped = communications.map((c) => ({
    id: c.id,
    name: c.name,
    channel: c.channel,
    communicationType: c.communicationType,
    category: c.category,
    preferenceGroup: c.preferenceGroup,
    preferenceCategories: c.preferenceCategories,
    triggerEvent: c.communicationPoint?.triggerEvent ?? null,
    contentOutline: c.contentOutline,
    status: c.status,
    tags: c.tags,
    description: c.description,
  }));

  return {
    domain: domain ? { id: domain.id, name: domain.name } : null,
    communications: mapped,
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };
}
