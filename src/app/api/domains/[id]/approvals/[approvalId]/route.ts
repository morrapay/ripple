import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; approvalId: string }> }) {
  const { id, approvalId } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!["ANALYST", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Not authorized to review" }, { status: 403 });
  }

  const body = await req.json();
  const { status, note } = body;
  if (!["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const approval = await prisma.approvalRequest.update({
    where: { id: approvalId },
    data: { status, reviewerId: user.id, note: note || null },
    include: { requester: { select: { id: true, name: true, email: true } } },
  });

  await prisma.notification.create({
    data: {
      userId: approval.requester.id,
      type: status === "APPROVED" ? "APPROVAL_GRANTED" : "APPROVAL_REJECTED",
      title: status === "APPROVED" ? "Events approved" : "Events need changes",
      body: status === "APPROVED"
        ? `${user.name ?? user.email} approved your events`
        : `${user.name ?? user.email} requested changes${note ? `: ${note}` : ""}`,
      link: `/domain/${id}/data-layer`,
    },
  });

  return NextResponse.json({ approval });
}
