import { prisma } from "@/lib/prisma";

export async function listSupportedServices() {
  return prisma.supportedService.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createSupportedService(data: { name: string; code: string }) {
  return prisma.supportedService.create({
    data: {
      name: data.name,
      code: data.code,
    },
  });
}

export async function createSupportedServicesBulk(
  items: { name: string; code: string }[]
) {
  return prisma.supportedService.createMany({
    data: items,
    skipDuplicates: true,
  });
}
