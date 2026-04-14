import { NextRequest, NextResponse } from "next/server";
import { getDomainById } from "@/lib/services/domain";
import {
  getAllRules,
  deactivateRule,
  getActiveDriftSignals,
} from "@/lib/ai/learning-store";

/**
 * GET /api/domains/[id]/journey-mapping/rules
 * Returns all learned rules and active drift signals for the domain.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: domainId } = await params;
    const domain = await getDomainById(domainId);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const [rules, driftSignals] = await Promise.all([
      getAllRules(domainId),
      getActiveDriftSignals(domainId),
    ]);

    return NextResponse.json({ rules, driftSignals });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch rules" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/domains/[id]/journey-mapping/rules
 * Deactivates a specific rule by id (passed as query param ?ruleId=xxx).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: domainId } = await params;
    const domain = await getDomainById(domainId);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const ruleId = request.nextUrl.searchParams.get("ruleId");
    if (!ruleId) {
      return NextResponse.json(
        { error: "ruleId query param is required" },
        { status: 400 }
      );
    }

    await deactivateRule(ruleId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to deactivate rule" },
      { status: 500 }
    );
  }
}
