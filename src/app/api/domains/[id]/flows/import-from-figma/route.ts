import { NextRequest, NextResponse } from "next/server";
import { getDomainById } from "@/lib/services/domain";
import { createFlowsBulk, listFlowsByDomain } from "@/lib/services/flow";

function extractFileKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts.length >= 2) {
      const fileType = pathParts[0];
      const fileKey = pathParts[1];
      if ((fileType === "file" || fileType === "design") && fileKey) {
        return fileKey;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function inferFlowType(name: string): "HAPPY_FLOW" | "UNHAPPY_FLOW" {
  const lower = name.toLowerCase();
  if (
    lower.includes("unhappy") ||
    lower.includes("error") ||
    lower.includes("fail") ||
    lower.includes("sad")
  ) {
    return "UNHAPPY_FLOW";
  }
  return "HAPPY_FLOW";
}

function collectFrames(
  node: { type?: string; name?: string; id?: string; children?: unknown[] },
  baseUrl: string,
  result: { name: string; flowType: "HAPPY_FLOW" | "UNHAPPY_FLOW"; figmaLink: string }[] = []
): void {
  if (!node) return;
  const nodeId = node.id ? String(node.id).replace(/:/g, "-") : "";
  const frameUrl = nodeId ? `${baseUrl}?node-id=${nodeId}` : baseUrl;

  if (node.type === "FRAME" && node.name) {
    result.push({
      name: node.name,
      flowType: inferFlowType(node.name),
      figmaLink: frameUrl,
    });
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      collectFrames(child as Parameters<typeof collectFrames>[0], baseUrl, result);
    }
  }
}

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

    const token = process.env.FIGMA_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Figma integration not configured. Add FIGMA_ACCESS_TOKEN to .env" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const figmaUrl = typeof body.figmaUrl === "string" ? body.figmaUrl.trim() : "";
    if (!figmaUrl) {
      return NextResponse.json(
        { error: "figmaUrl is required" },
        { status: 400 }
      );
    }

    const fileKey = extractFileKeyFromUrl(figmaUrl);
    if (!fileKey) {
      return NextResponse.json(
        { error: "Invalid Figma URL. Use format: https://www.figma.com/file/KEY or https://www.figma.com/design/KEY" },
        { status: 400 }
      );
    }

    const baseUrl = figmaUrl.split("?")[0];
    const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: {
        "X-Figma-Token": token,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 403) {
        return NextResponse.json(
          { error: "Figma access denied. Check token and file permissions." },
          { status: 403 }
        );
      }
      if (res.status === 404) {
        return NextResponse.json(
          { error: "Figma file not found. Check the URL and token permissions." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Figma API error: ${errText}` },
        { status: res.status }
      );
    }

    const data = (await res.json()) as {
      document?: { children?: unknown[] };
      err?: string;
    };

    if (data.err) {
      return NextResponse.json(
        { error: data.err },
        { status: 400 }
      );
    }

    const frames: { name: string; flowType: "HAPPY_FLOW" | "UNHAPPY_FLOW"; figmaLink: string }[] = [];
    if (data.document) {
      collectFrames(data.document as Parameters<typeof collectFrames>[0], baseUrl, frames);
    }

    if (frames.length === 0) {
      return NextResponse.json(
        { error: "No frames found in the Figma file. Add frames to your flows." },
        { status: 400 }
      );
    }

    await createFlowsBulk(domainId, frames);
    const flows = await listFlowsByDomain(domainId);
    return NextResponse.json({ flows });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to import from Figma" },
      { status: 500 }
    );
  }
}
