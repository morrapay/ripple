import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TAKE = 5;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const domainId = searchParams.get("domainId")?.trim() ?? "";

    if (!domainId) {
      return NextResponse.json({ error: "domainId is required" }, { status: 400 });
    }

    if (!q) {
      return NextResponse.json({
        results: {
          communications: [],
          journeys: [],
          steps: [],
          behavioralEvents: [],
          applicationEvents: [],
        },
      });
    }

    const nameFilter = { contains: q, mode: "insensitive" as const };
    const eventNameFilter = { contains: q, mode: "insensitive" as const };

    const [
      communications,
      journeys,
      steps,
      behavioralEvents,
      applicationEvents,
    ] = await Promise.all([
      prisma.communication.findMany({
        where: { domainId, name: nameFilter },
        take: TAKE,
        select: { id: true, name: true, channel: true },
        orderBy: { name: "asc" },
      }),
      prisma.journey.findMany({
        where: { domainId, name: nameFilter },
        take: TAKE,
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.journeyStep.findMany({
        where: {
          domainId,
          name: nameFilter,
          journeyId: { not: null },
        },
        take: TAKE,
        select: { id: true, name: true, kind: true, journeyId: true },
        orderBy: { name: "asc" },
      }),
      prisma.behavioralEvent.findMany({
        where: { domainId, eventName: eventNameFilter },
        take: TAKE,
        select: { id: true, eventName: true },
        orderBy: { eventName: "asc" },
      }),
      prisma.applicationEvent.findMany({
        where: { domainId, eventName: eventNameFilter },
        take: TAKE,
        select: { id: true, eventName: true },
        orderBy: { eventName: "asc" },
      }),
    ]);

    return NextResponse.json({
      results: {
        communications: communications.map((c) => ({
          id: c.id,
          name: c.name,
          channel: c.channel,
          type: "communication" as const,
        })),
        journeys: journeys.map((j) => ({
          id: j.id,
          name: j.name,
          type: "journey" as const,
        })),
        steps: steps
          .filter((s): s is typeof s & { journeyId: string } => s.journeyId != null)
          .map((s) => ({
            id: s.id,
            name: s.name,
            kind: s.kind,
            journeyId: s.journeyId,
            type: "step" as const,
          })),
        behavioralEvents: behavioralEvents.map((e) => ({
          id: e.id,
          eventName: e.eventName,
          type: "behavioral_event" as const,
        })),
        applicationEvents: applicationEvents.map((e) => ({
          id: e.id,
          eventName: e.eventName,
          type: "application_event" as const,
        })),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
