"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type BrazeAvailability = "AVAILABLE" | "NOT_AVAILABLE" | "REGION_SPECIFIC";
type ChannelType = "INTERNAL" | "EXTERNAL";

interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  brazeAvailability: BrazeAvailability;
  regionAvailability: string[];
  useCase: string | null;
  description: string | null;
}

const AVAILABILITY_LABELS: Record<BrazeAvailability, string> = {
  AVAILABLE: "Available in Braze",
  NOT_AVAILABLE: "Currently not available",
  REGION_SPECIFIC: "Available for specific region(s)",
};

const AVAILABILITY_COLORS: Record<BrazeAvailability, string> = {
  AVAILABLE: "bg-emerald-600/30 text-emerald-300",
  NOT_AVAILABLE: "bg-zinc-600/50 text-zinc-400",
  REGION_SPECIFIC: "bg-amber-600/30 text-amber-300",
};

const TYPE_LABELS: Record<ChannelType, string> = {
  INTERNAL: "Internal",
  EXTERNAL: "External",
};

export function ChannelsManagement() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/channels");
      const data = await res.json();
      setChannels(data.channels ?? []);
    } catch {
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="px-4 py-2 rounded-md border border-zinc-600 text-zinc-400 text-sm hover:bg-zinc-800"
        >
          Import bulk
        </button>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90"
        >
          + Add channel
        </button>
      </div>

      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading…</div>
        ) : channels.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <p className="mb-2">No channels yet.</p>
            <p className="text-sm">
              Add internal and external channels with Braze availability and use
              cases.
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
                    Channel
                  </th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">
                    Braze availability
                  </th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">
                    Region(s)
                  </th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">
                    Use case
                  </th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {channels.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--card-border)] hover:bg-zinc-800/50"
                  >
                    <td className="px-4 py-3 text-zinc-300">
                      {TYPE_LABELS[c.type]}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                      {c.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${AVAILABILITY_COLORS[c.brazeAvailability]}`}
                      >
                        {AVAILABILITY_LABELS[c.brazeAvailability]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {c.regionAvailability.length > 0
                        ? c.regionAvailability.join(", ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 max-w-[200px] truncate">
                      {c.useCase ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm("Delete this channel?")) {
                            await fetch(`/api/channels/${c.id}`, {
                              method: "DELETE",
                            });
                            fetchData();
                            router.refresh();
                          }
                        }}
                        className="text-zinc-500 hover:text-red-400 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showImport && (
        <ImportChannelsModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            fetchData();
            router.refresh();
          }}
        />
      )}
      {showAdd && (
        <AddChannelModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            fetchData();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function ImportChannelsModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [json, setJson] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(json);
      const channels = Array.isArray(parsed) ? parsed : parsed.channels ?? [];
      if (channels.length === 0) {
        setError("Provide a JSON array of channels");
        return;
      }
      setSaving(true);
      setError(null);
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels }),
      });
      if (!res.ok) throw new Error("Import failed");
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="w-full max-w-lg rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Import channels
          </h3>
          <p className="text-sm text-zinc-400 mb-4">
            Paste JSON from your Communication Policy Book. Format:{" "}
            <code className="text-xs bg-zinc-800 px-1 rounded">
              {`[{"name":"Email","type":"EXTERNAL","brazeAvailability":"AVAILABLE","useCase":"Transactional"}]`}
            </code>
          </p>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm font-mono"
            placeholder='[{"name":"...","type":"INTERNAL|EXTERNAL","brazeAvailability":"AVAILABLE|NOT_AVAILABLE|REGION_SPECIFIC","regionAvailability":[],"useCase":"..."}]'
          />
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleImport}
              disabled={saving}
              className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-sm disabled:opacity-50"
            >
              {saving ? "Importing…" : "Import"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-zinc-600 text-zinc-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function AddChannelModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ChannelType>("EXTERNAL");
  const [brazeAvailability, setBrazeAvailability] =
    useState<BrazeAvailability>("NOT_AVAILABLE");
  const [regionAvailability, setRegionAvailability] = useState("");
  const [useCase, setUseCase] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          brazeAvailability,
          regionAvailability: regionAvailability
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean),
          useCase: useCase.trim() || undefined,
          description: description.trim() || undefined,
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
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="w-full max-w-md rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Add channel
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                placeholder="e.g. Email, Push, In-app"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ChannelType)}
                className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
              >
                <option value="INTERNAL">Internal</option>
                <option value="EXTERNAL">External</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Braze availability
              </label>
              <select
                value={brazeAvailability}
                onChange={(e) =>
                  setBrazeAvailability(e.target.value as BrazeAvailability)
                }
                className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
              >
                <option value="AVAILABLE">Available in Braze</option>
                <option value="NOT_AVAILABLE">Currently not available</option>
                <option value="REGION_SPECIFIC">
                  Available for specific region(s)
                </option>
              </select>
            </div>
            {brazeAvailability === "REGION_SPECIFIC" && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Regions (comma-separated)
                </label>
                <input
                  type="text"
                  value={regionAvailability}
                  onChange={(e) => setRegionAvailability(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                  placeholder="e.g. US, EU, APAC"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Use case (high-level)
              </label>
              <input
                type="text"
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                placeholder="e.g. Transactional notifications, Marketing campaigns"
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
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Adding…" : "Add"}
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
