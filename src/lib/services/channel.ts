import { prisma } from "@/lib/prisma";

export async function listChannels() {
  return prisma.channel.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function createChannel(data: {
  name: string;
  type: "INTERNAL" | "EXTERNAL";
  brazeAvailability: "AVAILABLE" | "NOT_AVAILABLE" | "REGION_SPECIFIC";
  regionAvailability?: string[];
  useCase?: string;
  description?: string;
}) {
  return prisma.channel.create({
    data: {
      name: data.name,
      type: data.type,
      brazeAvailability: data.brazeAvailability,
      regionAvailability: data.regionAvailability ?? [],
      useCase: data.useCase ?? null,
      description: data.description ?? null,
    },
  });
}

export async function updateChannel(
  id: string,
  data: Partial<{
    name: string;
    type: "INTERNAL" | "EXTERNAL";
    brazeAvailability: "AVAILABLE" | "NOT_AVAILABLE" | "REGION_SPECIFIC";
    regionAvailability: string[];
    useCase: string;
    description: string;
  }>
) {
  return prisma.channel.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.brazeAvailability !== undefined && {
        brazeAvailability: data.brazeAvailability,
      }),
      ...(data.regionAvailability !== undefined && {
        regionAvailability: data.regionAvailability,
      }),
      ...(data.useCase !== undefined && { useCase: data.useCase }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });
}

export async function deleteChannel(id: string) {
  return prisma.channel.delete({ where: { id } });
}
