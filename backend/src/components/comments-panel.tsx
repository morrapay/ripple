"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

export interface CommentItem {
  id: string;
  userName: string | null;
  userId: string | null;
  text: string;
  resolved: boolean;
  createdAt: string;
  replies: CommentItem[];
}

function countComments(nodes: CommentItem[]): number {
  return nodes.reduce((acc, n) => acc + 1 + countComments(n.replies ?? []), 0);
}

function initials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

interface Props {
  domainId: string;
  entityType: string;
  entityId: string;
}

function CommentRow({
  comment,
  depth,
  replyingToId,
  setReplyingToId,
  replyDraft,
  setReplyDraft,
  onReply,
  onToggleResolved,
  onDelete,
  canDelete,
}: {
  comment: CommentItem;
  depth: number;
  replyingToId: string | null;
  setReplyingToId: (id: string | null) => void;
  replyDraft: string;
  setReplyDraft: (s: string) => void;
  onReply: (parentId: string) => Promise<void>;
  onToggleResolved: (id: string, resolved: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  canDelete: (c: CommentItem) => boolean;
}) {
  const resolved = comment.resolved;
  const muted = resolved ? "text-zinc-500 line-through opacity-80" : "text-zinc-200";

  return (
    <div className={depth > 0 ? "mt-3 border-l border-zinc-700 pl-3" : ""}>
      <div className="flex gap-2">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
            resolved ? "bg-zinc-800 text-zinc-500" : "bg-zinc-700 text-zinc-100"
          }`}
          aria-hidden
        >
          {initials(comment.userName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span
              className={`text-sm font-medium ${
                resolved ? "text-zinc-500 line-through" : "text-zinc-100"
              }`}
            >
              {comment.userName ?? "User"}
            </span>
            <span className="text-xs text-zinc-500">{formatTime(comment.createdAt)}</span>
          </div>
          <p className={`mt-1 whitespace-pre-wrap text-sm ${muted}`}>{comment.text}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="text-xs text-zinc-400 hover:text-zinc-200"
              onClick={() => {
                setReplyingToId(replyingToId === comment.id ? null : comment.id);
                setReplyDraft("");
              }}
            >
              Reply
            </button>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={resolved}
                onChange={(e) => onToggleResolved(comment.id, e.target.checked)}
                className="rounded border-zinc-600 bg-zinc-800 text-zinc-400 focus:ring-zinc-500"
              />
              Resolved
            </label>
            {canDelete(comment) && (
              <button
                type="button"
                className="text-zinc-500 hover:text-red-400"
                title="Delete"
                aria-label="Delete comment"
                onClick={() => onDelete(comment.id)}
              >
                ×
              </button>
            )}
          </div>
          {replyingToId === comment.id && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                placeholder="Write a reply…"
                className="min-w-0 flex-1 rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void onReply(comment.id);
                  }
                }}
              />
              <button
                type="button"
                className="shrink-0 rounded bg-zinc-600 px-3 py-1.5 text-sm text-white hover:bg-zinc-500"
                onClick={() => onReply(comment.id)}
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
      {(comment.replies ?? []).map((r) => (
        <CommentRow
          key={r.id}
          comment={r}
          depth={depth + 1}
          replyingToId={replyingToId}
          setReplyingToId={setReplyingToId}
          replyDraft={replyDraft}
          setReplyDraft={setReplyDraft}
          onReply={onReply}
          onToggleResolved={onToggleResolved}
          onDelete={onDelete}
          canDelete={canDelete}
        />
      ))}
    </div>
  );
}

export function CommentsPanel({ domainId, entityType, entityId }: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const total = useMemo(() => countComments(comments), [comments]);

  const fetchComments = useCallback(async () => {
    const params = new URLSearchParams({ entityType, entityId });
    const res = await fetch(`/api/domains/${domainId}/comments?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setComments(data.comments ?? []);
  }, [domainId, entityType, entityId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ entityType, entityId });
        const res = await fetch(`/api/domains/${domainId}/comments?${params}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setComments(data.comments ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [domainId, entityType, entityId]);

  const canDelete = useCallback(
    (c: CommentItem) => {
      const uid = session?.user && "id" in session.user ? (session.user as { id?: string }).id : undefined;
      if (uid && c.userId && c.userId === uid) return true;
      const name = session?.user?.name ?? null;
      if (name && c.userName === name) return true;
      const email = session?.user?.email;
      if (email && c.userName === email.split("@")[0]) return true;
      return false;
    },
    [session]
  );

  const onToggleResolved = async (id: string, resolved: boolean) => {
    const res = await fetch(`/api/domains/${domainId}/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved }),
    });
    if (res.ok) await fetchComments();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch(`/api/domains/${domainId}/comments/${id}`, {
      method: "DELETE",
    });
    if (res.ok) await fetchComments();
  };

  const postComment = async (text: string, parentId?: string | null) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const res = await fetch(`/api/domains/${domainId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType,
        entityId,
        text: trimmed,
        parentId: parentId ?? undefined,
      }),
    });
    if (res.ok) {
      setNewText("");
      setReplyDraft("");
      setReplyingToId(null);
      await fetchComments();
    }
  };

  const onSendRoot = () => postComment(newText, null);

  const onReply = async (parentId: string) => postComment(replyDraft, parentId);

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-zinc-100 hover:bg-zinc-800/80"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>
          Comments ({loading ? "…" : total})
        </span>
        <span className="text-zinc-500">{open ? "▼" : "▶"}</span>
      </button>
      {open && (
        <div className="border-t border-zinc-700 px-3 pb-3 pt-2">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : total === 0 ? (
            <p className="text-sm text-zinc-500">No comments yet</p>
          ) : (
            <div className="space-y-1">
              {comments.map((c) => (
                <CommentRow
                  key={c.id}
                  comment={c}
                  depth={0}
                  replyingToId={replyingToId}
                  setReplyingToId={setReplyingToId}
                  replyDraft={replyDraft}
                  setReplyDraft={setReplyDraft}
                  onReply={onReply}
                  onToggleResolved={onToggleResolved}
                  onDelete={onDelete}
                  canDelete={canDelete}
                />
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-2 border-t border-zinc-700 pt-3">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Add a comment…"
              className="min-w-0 flex-1 rounded border border-zinc-600 bg-zinc-900 px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSendRoot();
                }
              }}
            />
            <button
              type="button"
              className="shrink-0 rounded bg-zinc-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-500"
              onClick={() => {
                void onSendRoot();
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
