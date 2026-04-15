import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const approvals = await prisma.approvalRequest.findMany({
      where: { domainId: id },
      orderBy: { createdAt: "desc" },
      include: {
        requester: { select: { name: true, email: true } },
        reviewer: { select: { name: true, email: true } },
      },
    });
    return NextResponse.json({ approvals });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    const approval = await prisma.approvalRequest.create({
      data: {
        domainId: id,
        requesterId: user.id,
        type: body.type || "EVENT_APPROVAL",
      },
      include: {
        requester: { select: { name: true, email: true } },
      },
    });

    const analysts = await prisma.user.findMany({
      where: { role: { in: ["ANALYST", "ADMIN"] } },
    });
    if (analysts.length > 0) {
      await prisma.notification.createMany({
        data: analysts.map((a) => ({
          userId: a.id,
          type: "APPROVAL_REQUEST" as const,
          title: "New approval request",
          body: `${user.name ?? user.email} requested event approval`,
          link: `/domain/${id}/data-layer`,
        })),
      });
    }

    return NextResponse.json({ approval });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create approval request" }, { status: 500 });
  }
}
