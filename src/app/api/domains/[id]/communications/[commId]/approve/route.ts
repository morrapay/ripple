import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createJiraTicket,
  getLegalProjectKey,
  getL10nProjectKey,
} from "@/lib/services/jira";

function buildCommunicationJiraDescription(comm: {
  name: string;
  description: string | null;
  channel: string | null;
  communicationType: string | null;
  category: string | null;
  domain: { name: string };
}): string {
  const parts = [
    `Communication: ${comm.name}`,
    `Domain: ${comm.domain.name}`,
    comm.channel ? `Channel: ${comm.channel}` : null,
    comm.communicationType ? `Communication type: ${comm.communicationType}` : null,
    comm.category ? `Category: ${comm.category}` : null,
    comm.description ? `Description:\n${comm.description}` : null,
  ].filter(Boolean);
  return parts.join("\n\n");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commId: string }> }
) {
  try {
    const { id, commId } = await params;
    const body = await request.json().catch(() => ({}));
    const approvedBy =
      typeof body.approvedBy === "string" && body.approvedBy.trim()
        ? body.approvedBy.trim()
        : "Admin";

    const existing = await prisma.communication.findFirst({
      where: { id: commId, domainId: id },
      include: { domain: { select: { name: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Communication not found" },
        { status: 404 }
      );
    }

    const jiraDescription = buildCommunicationJiraDescription(existing);

    const legalJira = await createJiraTicket({
      projectKey: getLegalProjectKey(),
      summary: `Legal Review: ${existing.name}`,
      description: jiraDescription,
    });

    const l10nJira = await createJiraTicket({
      projectKey: getL10nProjectKey(),
      summary: `Localization: ${existing.name}`,
      description: jiraDescription,
    });

    const notifyUsers = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "MANAGER", "CONTENT_WRITER"] },
      },
      select: { id: true },
    });

    const { communication, legalTicket, l10nTicket } = await prisma.$transaction(
      async (tx) => {
        const communication = await tx.communication.update({
          where: { id: commId },
          data: {
            contentApprovalStatus: "APPROVED",
            contentApprovedBy: approvedBy,
            contentApprovedAt: new Date(),
          },
          include: {
            domain: { select: { id: true, name: true } },
            communicationPoint: { include: { journeyStep: true } },
            template: true,
          },
        });

        const legalTicket = await tx.ticket.create({
          data: {
            domainId: id,
            communicationId: commId,
            type: "LEGAL_SIGNOFF",
            jiraKey: legalJira?.jiraKey ?? null,
            jiraUrl: legalJira?.jiraUrl ?? null,
            summary: `Legal Review: ${existing.name}`,
          },
        });

        const l10nTicket = await tx.ticket.create({
          data: {
            domainId: id,
            communicationId: commId,
            type: "LOCALIZATION",
            jiraKey: l10nJira?.jiraKey ?? null,
            jiraUrl: l10nJira?.jiraUrl ?? null,
            summary: `Localization: ${existing.name}`,
          },
        });

        if (notifyUsers.length > 0) {
          await tx.notification.createMany({
            data: notifyUsers.map((u) => ({
              userId: u.id,
              type: "APPROVAL_GRANTED" as const,
              title: "Content approved",
              body: `"${existing.name}" was approved. Legal and localization tickets were created.`,
              link: `/domain/${id}/communications`,
            })),
          });
        }

        return { communication, legalTicket, l10nTicket };
      }
    );

    return NextResponse.json({
      communication,
      tickets: [legalTicket, l10nTicket],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to approve communication" },
      { status: 500 }
    );
  }
}
