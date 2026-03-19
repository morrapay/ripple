"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type CommunicationStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "DEPRECATED"
  | "READY_FOR_BRAZE";

interface Template {
  id: string;
  channel: string;
  category: string | null;
  name: string;
  description: string | null;
}

interface CommunicationPoint {
  id: string;
  name: string;
  triggerEvent: string | null;
}

interface Communication {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  status: CommunicationStatus;
  owner: string | null;
  domain: { id: string; name: string };
  communicationPoint: CommunicationPoint | null;
  template: Template | null;
  contentOutline: unknown;
  createdAt: string;
  updatedAt: string;
}

interface PendingPoint {
  id: string;
  name: string;
  triggerEvent: string | null;
}

interface CommunicationsManagementProps {
  domainId: string;
}

const STATUS_LABELS: Record<CommunicationStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  DEPRECATED: "Deprecated",
  READY_FOR_BRAZE: "Ready for Braze",
};

const STATUS_COLORS: Record<CommunicationStatus, string> = {
  DRAFT: "bg-zinc-600 text-zinc-200",
  ACTIVE: "bg-emerald-600/30 text-emerald-300",
  PAUSED: "bg-amber-600/30 text-amber-300",
  DEPRECATED: "bg-red-600/30 text-red-300",
  READY_FOR_BRAZE: "bg-blue-600/30 text-blue-300",
};

export function CommunicationsManagement({
  domainId,
}: CommunicationsManagementProps) {
  const router = useRouter();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [pendingPoints, setPendingPoints] = useState<PendingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState<"updatedAt" | "name" | "channel" | "status">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (channelFilter) params.set("channel", channelFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (tagFilter) params.set("tag", tagFilter);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(
        `/api/domains/${domainId}/communications?${params}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCommunications(data.communications ?? []);
      setPendingPoints(data.pendingPoints ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [domainId, search, channelFilter, statusFilter, tagFilter, sortBy, sortOrder]);

  const allTags = Array.from(
    new Set(communications.flatMap((c) => c.tags))
  ).sort();
  const allChannels = Array.from(
    new Set(
      communications
        .map((c) => c.template?.channel)
        .filter(Boolean) as string[]
    )
  ).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="search"
            placeholder="Search by name, tag, or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm placeholder-zinc-500"
          />
        </div>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
        >
          <option value="">All channels</option>
          {allChannels.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
        >
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABELS) as CommunicationStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
        >
          <option value="">All tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [s, o] = e.target.value.split("-") as [string, "asc" | "desc"];
            setSortBy(s as typeof sortBy);
            setSortOrder(o);
          }}
          className="px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
        >
          <option value="updatedAt-desc">Last updated ↓</option>
          <option value="updatedAt-asc">Last updated ↑</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="channel-asc">Channel A–Z</option>
          <option value="status-asc">Status</option>
        </select>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90"
        >
          + Add communication
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading…</div>
        ) : communications.length === 0 && pendingPoints.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <p className="mb-2">No communications yet.</p>
            <p className="text-sm">
              Add communications from the Mapping journey or create standalone
              entries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-zinc-900/50">
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">
                    Template
                  </th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">
                    Tags
                  </th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">
                    Event Triggered
                  </th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">
                    Ownership
                  </th>
                </tr>
              </thead>
              <tbody>
                {communications.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="border-b border-[var(--card-border)] hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-zinc-300">
                      {c.template?.channel ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 max-w-[200px] truncate">
                      {c.description ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {c.template?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded text-xs bg-zinc-700 text-zinc-300"
                          >
                            {t}
                          </span>
                        ))}
                        {c.tags.length > 3 && (
                          <span className="text-zinc-500 text-xs">
                            +{c.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                      {c.communicationPoint?.triggerEvent ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[c.status]}`}
                      >
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {c.owner ?? c.domain.name}
                    </td>
                  </tr>
                ))}
                {pendingPoints.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setShowAddModal(true)}
                    className="border-b border-[var(--card-border)] hover:bg-zinc-800/50 cursor-pointer bg-zinc-900/30"
                  >
                    <td className="px-4 py-3 text-zinc-500">—</td>
                    <td className="px-4 py-3 text-zinc-500 italic">
                      {p.name} (from journey)
                    </td>
                    <td colSpan={6} className="px-4 py-3 text-zinc-500 text-xs">
                      Click to create communication from this trigger
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && (
        <CommunicationDetailDrawer
          domainId={domainId}
          communicationId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdate={fetchData}
        />
      )}

      {showAddModal && (
        <AddCommunicationModal
          domainId={domainId}
          pendingPoints={pendingPoints}
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            fetchData();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CommunicationOverviewTab({
  domainId,
  communication: comm,
  onUpdate,
}: {
  domainId: string;
  communication: Communication;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(comm.status);
  const [saving, setSaving] = useState(false);

  const handleSaveStatus = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/domains/${domainId}/communications/${comm.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      if (res.ok) {
        setEditing(false);
        onUpdate();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-zinc-500">Description</label>
        <p className="text-zinc-200 mt-1">
          {comm.description ?? "—"}
        </p>
      </div>
      <div>
        <label className="text-xs text-zinc-500">Domain & ownership</label>
        <p className="text-zinc-200 mt-1">
          {comm.domain.name} {comm.owner && `• ${comm.owner}`}
        </p>
      </div>
      <div>
        <label className="text-xs text-zinc-500">Status</label>
        <div className="mt-1 flex items-center gap-2">
          {editing ? (
            <>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as CommunicationStatus)
                }
                className="px-2 py-1 rounded border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
              >
                {(Object.keys(STATUS_LABELS) as CommunicationStatus[]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  )
                )}
              </select>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={saving}
                className="px-2 py-1 rounded bg-[var(--accent)] text-white text-xs"
              >
                {saving ? "…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-2 py-1 rounded border border-zinc-600 text-zinc-400 text-xs"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[comm.status]}`}
              >
                {STATUS_LABELS[comm.status]}
              </span>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>
      <div>
        <label className="text-xs text-zinc-500">Template</label>
        <p className="text-zinc-200 mt-1">
          {comm.template?.name ?? "—"} (
          {comm.template?.channel ?? "—"})
        </p>
      </div>
      <div>
        <label className="text-xs text-zinc-500">Tags</label>
        <p className="text-zinc-200 mt-1 flex flex-wrap gap-1">
          {comm.tags.length
            ? comm.tags.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 rounded text-xs bg-zinc-700"
                >
                  {t}
                </span>
              ))
            : "—"}
        </p>
      </div>
      <div className="text-xs text-zinc-500 pt-4">
        Created {new Date(comm.createdAt).toLocaleString()} • Last
        updated {new Date(comm.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}

function CommunicationDetailDrawer({
  domainId,
  communicationId,
  onClose,
  onUpdate,
}: {
  domainId: string;
  communicationId: string;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [comm, setComm] = useState<Communication | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "trigger" | "template" | "metrics">("overview");

  const fetchComm = () => {
    return fetch(`/api/domains/${domainId}/communications/${communicationId}`)
      .then((r) => r.json())
      .then((d) => {
        setComm(d.communication);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchComm();
  }, [domainId, communicationId]);

  const handleExport = async (format: "summary" | "csv") => {
    if (!comm) return;
    if (format === "summary") {
      const blob = new Blob(
        [
          `# ${comm.name}\n\n` +
            `**Domain:** ${comm.domain.name}\n` +
            `**Channel:** ${comm.template?.channel ?? "—"}\n` +
            `**Status:** ${STATUS_LABELS[comm.status]}\n` +
            `**Trigger:** ${comm.communicationPoint?.triggerEvent ?? "—"}\n\n` +
            `## Description\n${comm.description ?? "—"}\n\n` +
            `## Tags\n${comm.tags.join(", ") || "—"}`,
        ],
        { type: "text/markdown" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${comm.name.replace(/\s+/g, "-")}-spec.md`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const csv = `Name,Channel,Status,Trigger,Tags\n"${comm.name}","${comm.template?.channel ?? ""}","${comm.status}","${comm.communicationPoint?.triggerEvent ?? ""}","${comm.tags.join(";")}"`;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${comm.name.replace(/\s+/g, "-")}-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!comm && !loading) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[var(--card)] border-l border-[var(--card-border)] z-50 overflow-auto shadow-xl">
        <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {comm?.name ?? "…"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport("summary")}
              className="px-3 py-1.5 rounded-md border border-zinc-600 text-zinc-400 text-sm hover:bg-zinc-800"
            >
              Export spec
            </button>
            <button
              type="button"
              onClick={() => handleExport("csv")}
              className="px-3 py-1.5 rounded-md border border-zinc-600 text-zinc-400 text-sm hover:bg-zinc-800"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-zinc-500">Loading…</div>
          ) : comm ? (
            <>
              <div className="flex gap-2 mb-6 border-b border-zinc-700 pb-2">
                {(["overview", "trigger", "template", "metrics"] as const).map(
                  (tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded text-sm capitalize ${
                        activeTab === tab
                          ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>
              {activeTab === "overview" && (
                <CommunicationOverviewTab
                  domainId={domainId}
                  communication={comm}
                  onUpdate={() => {
                    onUpdate();
                    fetchComm();
                  }}
                />
              )}
              {activeTab === "trigger" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500">Event(s) linked</label>
                    <p className="text-zinc-200 mt-1 font-mono text-sm">
                      {comm.communicationPoint?.triggerEvent ?? "—"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Trigger conditions</label>
                    <p className="text-zinc-200 mt-1">
                      {comm.communicationPoint?.triggerEvent
                        ? "Configured via journey mapping"
                        : "—"}
                    </p>
                  </div>
                </div>
              )}
              {activeTab === "template" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500">Template preview</label>
                    <div className="mt-2 p-4 rounded-lg border border-zinc-600 bg-zinc-900/50 text-zinc-400 text-sm">
                      {comm.template?.description ?? "No template linked"}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Content outline</label>
                    <pre className="mt-2 p-4 rounded-lg border border-zinc-600 bg-zinc-900/50 text-zinc-400 text-xs overflow-auto max-h-48">
                      {comm.contentOutline
                        ? JSON.stringify(comm.contentOutline, null, 2)
                        : "—"}
                    </pre>
                  </div>
                </div>
              )}
              {activeTab === "metrics" && (
                <div className="rounded-lg border border-zinc-600 bg-zinc-900/30 p-6 text-center text-zinc-500 text-sm">
                  Performance metrics (Sent, Delivered, CTR, etc.) will be
                  integrated from CEP/Braze & analytics.
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

function AddCommunicationModal({
  domainId,
  pendingPoints,
  onClose,
  onCreated,
}: {
  domainId: string;
  pendingPoints: PendingPoint[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [communicationPointId, setCommunicationPointId] = useState("");
  const [tags, setTags] = useState("");
  const [owner, setOwner] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pendingPoints.length === 1) {
      setCommunicationPointId(pendingPoints[0].id);
      setName(pendingPoints[0].name);
    }
  }, [pendingPoints]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/domains/${domainId}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Untitled",
          description: description.trim() || undefined,
          communicationPointId: communicationPointId || undefined,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          owner: owner.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to create");
      }
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="w-full max-w-md rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Add communication
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {pendingPoints.length > 0 && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  From journey trigger (optional)
                </label>
                <select
                  value={communicationPointId}
                  onChange={(e) => {
                    setCommunicationPointId(e.target.value);
                    const p = pendingPoints.find((x) => x.id === e.target.value);
                    if (p) setName(p.name);
                  }}
                  className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                >
                  <option value="">— None —</option>
                  {pendingPoints.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                placeholder="Canonical communication name"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                placeholder="Purpose & expected user action"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                placeholder="lifecycle, domain, persona, region"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Owner</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                placeholder="Comms owner"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md border border-zinc-600 text-zinc-400 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
