import { NextRequest, NextResponse } from "next/server";
import { listFlowsByDomain, createFlow } from "@/lib/services/flow";
import { createFlowSchema } from "@/lib/validations/flow";
import { getDomainById } from "@/lib/services/domain";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }
    const flows = await listFlowsByDomain(id);
    return NextResponse.json({ flows });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch flows" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }
    const body = await request.json();
    const parsed = createFlowSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const flow = await createFlow(id, parsed.data);
    return NextResponse.json({ flow });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create flow" },
      { status: 500 }
    );
  }
}
