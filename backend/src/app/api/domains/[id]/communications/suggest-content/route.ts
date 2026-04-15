import { NextRequest, NextResponse } from "next/server";
import { getDomainById } from "@/lib/services/domain";
import { suggestContent } from "@/lib/ai/content-suggester";

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
    const content = suggestContent({
      channel: body.channel ?? "email",
      communicationType: body.communicationType ?? null,
      category: body.category ?? null,
      triggerEvent: body.triggerEvent ?? null,
      commName: body.commName ?? "Communication",
      domainName: domain.name,
    });

    return NextResponse.json({ content });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to suggest content" },
      { status: 500 }
    );
  }
}
