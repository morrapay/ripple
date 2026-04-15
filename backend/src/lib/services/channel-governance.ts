import { prisma } from "@/lib/prisma";

export async function listChannelGovernance(channelId?: string) {
  return prisma.channelGovernance.findMany({
    where: channelId ? { channelId } : undefined,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { channel: true },
  });
}

export async function createChannelGovernance(data: {
  channelId?: string;
  title: string;
  content: string;
  category?: string;
  order?: number;
}) {
  return prisma.channelGovernance.create({
    data: {
      channelId: data.channelId ?? null,
      title: data.title,
      content: data.content,
      category: data.category ?? null,
      order: data.order ?? 0,
    },
    include: { channel: true },
  });
}

export async function updateChannelGovernance(
  id: string,
  data: Partial<{
    channelId: string | null;
    title: string;
    content: string;
    category: string;
    order: number;
  }>
) {
  return prisma.channelGovernance.update({
    where: { id },
    data: {
      ...(data.channelId !== undefined && { channelId: data.channelId }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.order !== undefined && { order: data.order }),
    },
    include: { channel: true },
  });
}

export async function deleteChannelGovernance(id: string) {
  return prisma.channelGovernance.delete({ where: { id } });
}
