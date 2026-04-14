import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomainById } from "@/lib/services/domain";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const existing = await prisma.comment.findFirst({
      where: { id: commentId, domainId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const body = await request.json();
    const text = body.text as string | undefined;
    const resolved = body.resolved as boolean | undefined;

    const data: { text?: string; resolved?: boolean } = {};
    if (typeof text === "string") {
      const trimmed = text.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "text cannot be empty" }, { status: 400 });
      }
      data.text = trimmed;
    }
    if (typeof resolved === "boolean") data.resolved = resolved;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data,
    });

    return NextResponse.json({ comment });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const existing = await prisma.comment.findFirst({
      where: { id: commentId, domainId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
