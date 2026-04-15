import { NextRequest, NextResponse } from "next/server";
import { mockAIProvider } from "@/lib/ai/mock-provider";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const businessQuestions = (body.businessQuestions ?? []) as string[];

    if (businessQuestions.length === 0) {
      return NextResponse.json(
        { error: "businessQuestions array is required and must not be empty" },
        { status: 400 }
      );
    }

    const suggestions = mockAIProvider.generateApplicationEventsFromQuestions
      ? await mockAIProvider.generateApplicationEventsFromQuestions(
          businessQuestions
        )
      : [];

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate application events" },
      { status: 500 }
    );
  }
}
