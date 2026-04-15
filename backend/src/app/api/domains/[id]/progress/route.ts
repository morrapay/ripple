import { NextRequest, NextResponse } from "next/server";
import { getDomainProgress } from "@/lib/services/progress";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const progress = await getDomainProgress(id);
    return NextResponse.json({ progress });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
