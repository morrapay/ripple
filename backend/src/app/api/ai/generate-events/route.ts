import { NextRequest, NextResponse } from "next/server";
import { EventGenerator } from "@/lib/ai/event-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const screens = (body.screens ?? []) as {
      name: string;
      figmaLink?: string;
    }[];
    const businessQuestions = (body.businessQuestions ?? []) as string[];
    const communicationIntents = (body.communicationIntents ?? []) as {
      what: string;
      when: string;
      where: string;
    }[];

    if (
      screens.length === 0 &&
      businessQuestions.length === 0 &&
      communicationIntents.length === 0
    ) {
      return NextResponse.json(
        { error: "Provide at least one input: screens, business questions, or communication intents" },
        { status: 400 }
      );
    }

    const result = await EventGenerator.generate({
      screens,
      businessQuestions,
      communicationIntents,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate events" },
      { status: 500 }
    );
  }
}
