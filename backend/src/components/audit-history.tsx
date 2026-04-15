"use client";

import { useCallback, useEffect, useState } from "react";

type AuditAction = "CREATE" | "UPDATE" | "DELETE";

interface AuditLogRow {
  id: string;
  domainId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId: string | null;
  userName: string | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

function formatJson(value: unknown): string {
  if (value === undefined) return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  try {
    return JSON.stringify(value, null, 0);
  } catch {
    return String(value);
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function ChangesDiff({ changes }: { changes: Record<string, unknown> | null }) {
  if (!changes || Object.keys(changes).length === 0) {
    return (
      <p className="text-xs text-zinc-500 italic">No field data recorded</p>
    );
  }

  const rows: { key: string; left: string; right: string | null }[] = [];

  for (const [key, raw] of Object.entries(changes)) {
    if (
      isPlainObject(raw) &&
      "old" in raw &&
      "new" in raw &&
      Object.keys(raw).length <= 3
    ) {
      rows.push({ key, left: formatJson(raw.old), right: formatJson(raw.new) });
      continue;
    }
    rows.push({ key, left: "", right: formatJson(raw) });
  }

  return (
    <ul className="mt-2 space-y-1.5 font-mono text-[11px] leading-relaxed text-zinc-300">
      {rows.map(({ key, left, right }) => (
        <li key={key} className="rounded border border-zinc-700/60 bg-zinc-900/50 px-2 py-1.5">
          <span className="text-zinc-500">{key}</span>
          {right !== null && left !== "" ? (
            <span className="ml-1 break-all">
              <span className="text-red-400/90">{left}</span>
              <span className="text-zinc-600 mx-1">→</span>
              <span className="text-emerald-400/90">{right}</span>
            </span>
          ) : (
            <span className="ml-1 text-zinc-400 break-all">
              {right !== null ? (
                <><span className="text-zinc-600">→</span> {right}</>
              ) : (
                left
              )}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function actionBadgeClass(action: AuditAction): string {
  switch (action) {
    case "CREATE":
      return "bg-emerald-950/80 text-emerald-400 border-emerald-800";
    case "UPDATE":
      return "bg-blue-950/80 text-blue-400 border-blue-800";
    case "DELETE":
      return "bg-red-950/80 text-red-400 border-red-800";
    default:
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
}

interface AuditHistoryProps {
  domainId: string;
  entityType: string;
  entityId: string;
}

export function AuditHistory({ domainId, entityType, entityId }: AuditHistoryProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ entityType, entityId, limit: "50", offset: "0" });
      const res = await fetch(`/api/domains/${encodeURIComponent(domainId)}/audit?${q.toString()}`);
      if (!res.ok) { setError("Could not load history"); setLogs([]); return; }
      const data = await res.json();
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch {
      setError("Could not load history");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [domainId, entityType, entityId]);

  useEffect(() => {
    if (open) void fetchLogs();
  }, [open, fetchLogs]);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        aria-expanded={open}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
        <span>{open ? "Hide History" : "History"}</span>
        {!open && logs.length > 0 && (
          <span className="text-[10px] text-zinc-600">({logs.length})</span>
        )}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-[var(--card-border)] bg-zinc-900/50">
          <div className="max-h-64 overflow-y-auto p-3">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-zinc-500">
                <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            ) : error ? (
              <p className="py-4 text-center text-xs text-red-400">{error}</p>
            ) : logs.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-500">No history yet</p>
            ) : (
              <ol className="relative space-y-0 border-l border-zinc-700 pl-3">
                {logs.map((log) => (
                  <li key={log.id} className="relative pb-4 last:pb-0">
                    <span className="absolute -left-[15px] top-1.5 h-2 w-2 rounded-full border-2 border-zinc-600 bg-zinc-900" />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${actionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-zinc-400">
                      {log.userName?.trim() || "System"}
                    </p>
                    <ChangesDiff
                      changes={
                        log.changes && typeof log.changes === "object" && !Array.isArray(log.changes)
                          ? (log.changes as Record<string, unknown>)
                          : null
                      }
                    />
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
