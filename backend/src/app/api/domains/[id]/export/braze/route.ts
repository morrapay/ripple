import { NextRequest, NextResponse } from "next/server";
import { getDomainById } from "@/lib/services/domain";
import { generateBrazeExport } from "@/lib/services/braze-export";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const data = await generateBrazeExport(id);
    const format = request.nextUrl.searchParams.get("format");

    if (format === "download") {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="braze-export-${domain.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.json"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
