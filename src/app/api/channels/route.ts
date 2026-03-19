import { NextRequest, NextResponse } from "next/server";
import {
  listChannels,
  createChannel,
} from "@/lib/services/channel";

export async function GET() {
  try {
    const channels = await listChannels();
    return NextResponse.json({ channels });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (Array.isArray(body.channels)) {
      const channels = [];
      for (const c of body.channels) {
        const ch = await createChannel({
          name: c.name,
          type: c.type ?? "EXTERNAL",
          brazeAvailability: c.brazeAvailability ?? "NOT_AVAILABLE",
          regionAvailability: c.regionAvailability ?? [],
          useCase: c.useCase,
          description: c.description,
        });
        channels.push(ch);
      }
      return NextResponse.json({ channels });
    }
    const channel = await createChannel({
      name: body.name,
      type: body.type ?? "EXTERNAL",
      brazeAvailability: body.brazeAvailability ?? "NOT_AVAILABLE",
      regionAvailability: body.regionAvailability,
      useCase: body.useCase,
      description: body.description,
    });
    return NextResponse.json({ channel });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}
