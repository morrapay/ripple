import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "json";

    const [domain, behavioralEvents, applicationEvents, journeySteps] = await Promise.all([
      prisma.domain.findUnique({ where: { id } }),
      prisma.behavioralEvent.findMany({ where: { domainId: id } }),
      prisma.applicationEvent.findMany({ where: { domainId: id } }),
      prisma.journeyStep.findMany({
        where: { domainId: id },
        include: {
          behavioralEvents: { include: { behavioralEvent: true } },
          applicationEvents: { include: { applicationEvent: true } },
          communicationPoints: true,
        },
      }),
    ]);

    if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 404 });

    const data = {
      domain: { id: domain.id, name: domain.name },
      exportedAt: new Date().toISOString(),
      behavioralEvents: behavioralEvents.map((e) => ({
        eventName: e.eventName,
        eventType: e.eventType,
        description: e.description,
        status: e.status,
        properties: e.eventProperties,
      })),
      applicationEvents: applicationEvents.map((e) => ({
        eventName: e.eventName,
        eventType: e.eventType,
        description: e.description,
        status: e.status,
        handshakeContext: e.handshakeContext,
      })),
      journeySteps: journeySteps.map((s) => ({
        name: s.name,
        order: s.order,
        description: s.description,
        linkedBehavioralEvents: s.behavioralEvents.map((m) => m.behavioralEvent.eventName),
        linkedApplicationEvents: s.applicationEvents.map((m) => m.applicationEvent.eventName),
        communicationPoints: s.communicationPoints.map((cp) => cp.name),
      })),
    };

    if (format === "csv") {
      const rows = [["Event Name", "Type", "Category", "Status", "Description"]];
      for (const e of behavioralEvents) rows.push([e.eventName, e.eventType, "Behavioral", e.status, e.description ?? ""]);
      for (const e of applicationEvents) rows.push([e.eventName, e.eventType, "Application", e.status, e.description ?? ""]);
      const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${domain.name}-events.csv"` },
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to export domain data" }, { status: 500 });
  }
}
