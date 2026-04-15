import { NextRequest, NextResponse } from "next/server";
import {
  listChannelGovernance,
  createChannelGovernance,
} from "@/lib/services/channel-governance";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId") ?? undefined;
    const rules = await listChannelGovernance(channelId);
    return NextResponse.json({ rules });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch governance rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (Array.isArray(body.rules)) {
      const rules = [];
      for (let i = 0; i < body.rules.length; i++) {
        const r = body.rules[i];
        const rule = await createChannelGovernance({
          channelId: r.channelId,
          title: r.title,
          content: r.content,
          category: r.category,
          order: r.order ?? i,
        });
        rules.push(rule);
      }
      return NextResponse.json({ rules });
    }
    const rule = await createChannelGovernance({
      channelId: body.channelId,
      title: body.title,
      content: body.content,
      category: body.category,
      order: body.order,
    });
    return NextResponse.json({ rule });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create governance rule" },
      { status: 500 }
    );
  }
}
