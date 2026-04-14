import { NextRequest, NextResponse } from "next/server";
import { getDomainById } from "@/lib/services/domain";
import { EventToJourneyMapper } from "@/lib/ai/event-to-journey-mapper";
import type { UserEditedJourney, LearningMode } from "@/lib/ai/journey-mapper-types";

/**
 * POST /api/domains/[id]/journey-mapping/learn
 * Accepts a user-edited journey and extracts learning patterns.
 *
 * Body:
 *   generatedSteps: JourneyStep[]  — the steps as originally generated
 *   userEdited: UserEditedJourney   — the user's corrected version
 *   learningMode: "PASSIVE" | "ACTIVE"
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: domainId } = await params;
    const domain = await getDomainById(domainId);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const body = await request.json();
    const { generatedSteps, userEdited, learningMode } = body as {
      generatedSteps: Parameters<typeof EventToJourneyMapper.learnFromCorrections>[1] extends never ? never : never;
      userEdited: UserEditedJourney;
      learningMode: LearningMode;
    };

    if (!userEdited?.steps || !Array.isArray(userEdited.steps)) {
      return NextResponse.json(
        { error: "userEdited.steps is required" },
        { status: 400 }
      );
    }

    if (learningMode === "OFF") {
      return NextResponse.json({
        message: "Learning mode is OFF — no patterns extracted",
        diffs: [],
        newLearnings: [],
      });
    }

    const mode = learningMode === "ACTIVE" ? "ACTIVE" : "PASSIVE";

    const result = await EventToJourneyMapper.learnFromCorrections(
      domainId,
      body.generatedSteps ?? [],
      userEdited,
      mode
    );

    return NextResponse.json({
      message: `Extracted ${result.newLearnings.length} learning(s) from ${result.diffs.length} diff(s)`,
      diffs: result.diffs,
      newLearnings: result.newLearnings,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to process learning" },
      { status: 500 }
    );
  }
}
