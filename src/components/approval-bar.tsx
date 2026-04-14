"use client";

import { useState, useEffect, useCallback } from "react";

interface Approval {
  id: string;
  status: string;
  note: string | null;
  requester: { name: string | null; email: string };
  reviewer: { name: string | null; email: string } | null;
}

interface Props {
  domainId: string;
  hasEvents?: boolean;
}

export function ApprovalBar({ domainId, hasEvents = false }: Props) {
  const [approval, setApproval] = useState<Approval | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchApproval = useCallback(async () => {
    try {
      const res = await fetch(`/api/domains/${domainId}/approvals`);
      if (!res.ok) return;
      const data = await res.json();
      const approvals = data.approvals ?? [];
      if (approvals.length > 0) setApproval(approvals[0]);
    } catch { /* ignore */ }
  }, [domainId]);

  useEffect(() => { fetchApproval(); }, [fetchApproval]);

  const requestApproval = async () => {
    setLoading(true);
    try {
      await fetch(`/api/domains/${domainId}/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "EVENT_APPROVAL" }),
      });
      await fetchApproval();
    } finally { setLoading(false); }
  };

  const status = approval?.status ?? "NONE";

  type ActionConfig = { icon: string; message: string; tone: string; cta?: React.ReactNode };

  function getAction(): ActionConfig {
    switch (status) {
      case "NONE":
        if (!hasEvents) {
          return {
            icon: "→",
            message: "Next: Add screens and business questions, then generate events.",
            tone: "border-zinc-700 bg-zinc-900/50",
            cta: (
              <a
                href="#data-layer-input"
                onClick={(e) => { e.preventDefault(); document.getElementById("data-layer-input")?.scrollIntoView({ behavior: "smooth" }); }}
                className="px-3 py-1.5 rounded-md bg-zinc-700 text-white text-xs font-medium hover:bg-zinc-600 transition-colors whitespace-nowrap"
              >
                Get Started ↓
              </a>
            ),
          };
        }
        return {
          icon: "→",
          message: "Next: Review your events, then request analyst approval to proceed.",
          tone: "border-[var(--accent)]/30 bg-[var(--accent)]/5",
          cta: (
            <button
              onClick={requestApproval}
              disabled={loading}
              className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-xs font-medium disabled:opacity-50 hover:bg-[var(--accent-muted)] transition-colors"
            >
              {loading ? "Requesting…" : "Request Approval"}
            </button>
          ),
        };

      case "PENDING":
        return {
          icon: "⏳",
          message: `Waiting for analyst review.${approval?.requester ? ` Requested by ${approval.requester.name ?? approval.requester.email}.` : ""}`,
          tone: "border-amber-500/30 bg-amber-500/5",
          cta: (
            <a
              href={`/domain/${domainId}/mapping`}
              className="px-3 py-1.5 rounded-md bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition-colors whitespace-nowrap"
            >
              Continue to Mapping →
            </a>
          ),
        };

      case "APPROVED":
        return {
          icon: "✓",
          message: `Events approved${approval?.reviewer ? ` by ${approval.reviewer.name ?? approval.reviewer.email}` : ""}. Next: Export PBI or proceed to Journey Mapping.`,
          tone: "border-emerald-500/30 bg-emerald-500/5",
          cta: (
            <a
              href={`/api/domains/${domainId}/export-pbi?format=json`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
            >
              Export PBI
            </a>
          ),
        };

      case "REJECTED":
        return {
          icon: "↩",
          message: `Analyst requested changes.${approval?.note ? ` "${approval.note}"` : ""} Update events and re-request approval.`,
          tone: "border-red-500/30 bg-red-500/5",
          cta: (
            <button
              onClick={requestApproval}
              disabled={loading}
              className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-xs font-medium disabled:opacity-50 hover:bg-[var(--accent-muted)] transition-colors"
            >
              {loading ? "Requesting…" : "Re-request Approval"}
            </button>
          ),
        };

      default:
        return { icon: "→", message: "Unknown status.", tone: "border-zinc-700 bg-zinc-900/50" };
    }
  }

  const action = getAction();

  return (
    <div className={`rounded-lg border p-4 mb-6 flex items-center justify-between gap-4 flex-wrap ${action.tone}`}>
      <div className="flex items-center gap-3">
        <span className="text-base">{action.icon}</span>
        <p className="text-sm text-zinc-300">{action.message}</p>
      </div>
      {action.cta && <div className="shrink-0">{action.cta}</div>}
    </div>
  );
}
