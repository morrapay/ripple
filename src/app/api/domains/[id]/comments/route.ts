import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomainById } from "@/lib/services/domain";
import { getSessionUser } from "@/lib/get-session";
import type { Comment } from "@prisma/client";

type CommentWithReplies = Comment & { replies: CommentWithReplies[] };

function buildCommentTree(rows: Comment[]): CommentWithReplies[] {
  const byParent = new Map<string | null, Comment[]>();
  for (const row of rows) {
    const key = row.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(row);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  function attach(parentId: string | null): CommentWithReplies[] {
    const children = byParent.get(parentId) ?? [];
    return children.map((c) => ({
      ...c,
      replies: attach(c.id),
    }));
  }
  return attach(null);
}

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

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    const rows = await prisma.comment.findMany({
      where: {
        domainId: id,
        entityType,
        entityId,
      },
      orderBy: { createdAt: "desc" },
    });

    const comments = buildCommentTree(rows);

    return NextResponse.json({ comments });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
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
    const entityType = body.entityType as string | undefined;
    const entityId = body.entityId as string | undefined;
    const text = body.text as string | undefined;
    const parentId = body.parentId as string | undefined | null;

    if (!entityType || !entityId || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "entityType, entityId, and text are required" },
        { status: 400 }
      );
    }

    if (parentId) {
      const parent = await prisma.comment.findFirst({
        where: {
          id: parentId,
          domainId: id,
          entityType,
          entityId,
        },
      });
      if (!parent) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 400 });
      }
    }

    const sessionUser = await getSessionUser();
    const userName =
      sessionUser?.name?.trim() ||
      sessionUser?.email?.split("@")[0] ||
      "User";
    const userId = sessionUser?.id || null;

    const comment = await prisma.comment.create({
      data: {
        domainId: id,
        entityType,
        entityId,
        text: text.trim(),
        parentId: parentId ?? null,
        userName,
        userId: userId ?? null,
      },
    });

    return NextResponse.json({ comment });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
