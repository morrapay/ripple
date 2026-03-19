import { NextRequest, NextResponse } from "next/server";
import { mockAIProvider } from "@/lib/ai/mock-provider";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const flowNames = (body.flowNames ?? []) as string[];
    const flowTypes = (body.flowTypes ?? []) as ("HAPPY_FLOW" | "UNHAPPY_FLOW")[];

    if (flowNames.length === 0 || flowTypes.length === 0) {
      return NextResponse.json(
        { error: "flowNames and flowTypes are required" },
        { status: 400 }
      );
    }

    const suggestions = await mockAIProvider.generateBehavioralEventsFromAssets(
      flowNames,
      flowTypes
    );

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate behavioral events" },
      { status: 500 }
    );
  }
}
