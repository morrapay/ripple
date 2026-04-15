import { NextResponse } from "next/server";
import { listTemplates } from "@/lib/services/communication";

export async function GET() {
  try {
    const templates = await listTemplates();
    return NextResponse.json({ templates });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
