"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Channel {
  id: string;
  name: string;
}

interface GovernanceRule {
  id: string;
  title: string;
  content: string;
  category: string | null;
  order: number;
  channelId: string | null;
  channel: Channel | null;
}

export function GovernanceManagement() {
  const router = useRouter();
  const [rules, setRules] = useState<GovernanceRule[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [rulesRes, channelsRes] = await Promise.all([
        fetch("/api/channel-governance"),
        fetch("/api/channels"),
      ]);
      const rulesData = await rulesRes.json();
      const channelsData = await channelsRes.json();
      setRules(rulesData.rules ?? []);
      setChannels(channelsData.channels ?? []);
    } catch {
      setRules([]);
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
          + Add governance rule
        </button>
      </div>

      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading…</div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <p className="mb-2">No governance rules yet.</p>
            <p className="text-sm">
              Add channel governance policies from your Communication Policy
              Book.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--card-border)]">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 hover:bg-zinc-800/30 transition-colors"
              >
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === rule.id ? null : rule.id)
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-[var(--foreground)]">
                        {rule.title}
                      </h3>
                      {rule.channel && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-zinc-700 text-zinc-300">
                          {rule.channel.name}
                        </span>
                      )}
                      {rule.category && (
                        <span className="text-xs text-zinc-500">
                          {rule.category}
                        </span>
                      )}
                    </div>
                    {expandedId === rule.id && (
                      <div className="mt-3 text-sm text-zinc-400 whitespace-pre-wrap">
                        {rule.content}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-zinc-500 text-xs">
                      {expandedId === rule.id ? "▲" : "▼"}
                    </span>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm("Delete this rule?")) {
                          await fetch(`/api/channel-governance/${rule.id}`, {
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showImport && (
        <ImportGovernanceModal
          channels={channels}
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            fetchData();
            router.refresh();
          }}
        />
      )}
      {showAdd && (
        <AddGovernanceModal
          channels={channels}
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

function ImportGovernanceModal({
  channels,
  onClose,
  onImported,
}: {
  channels: Channel[];
  onClose: () => void;
  onImported: () => void;
}) {
  const [json, setJson] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(json);
      const rules = Array.isArray(parsed) ? parsed : parsed.rules ?? [];
      if (rules.length === 0) {
        setError("Provide a JSON array of rules");
        return;
      }
      setSaving(true);
      setError(null);
      const res = await fetch("/api/channel-governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
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
          className="w-full max-w-lg rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl p-6 max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Import governance rules
          </h3>
          <p className="text-sm text-zinc-400 mb-4">
            Paste JSON from your Communication Policy Book. Format:{" "}
            <code className="text-xs bg-zinc-800 px-1 rounded">
              {`[{"title":"...","content":"...","channelId":"optional","category":"..."}]`}
            </code>
          </p>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm font-mono"
            placeholder='[{"title":"Email frequency","content":"Max 3 per day...","category":"Frequency"}]'
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

function AddGovernanceModal({
  channels,
  onClose,
  onCreated,
}: {
  channels: Channel[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [channelId, setChannelId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/channel-governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channelId || null,
          title: title.trim(),
          content: content.trim(),
          category: category.trim() || null,
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
          className="w-full max-w-lg rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl p-6 max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Add governance rule
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Channel (optional)
              </label>
              <select
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
              >
                <option value="">— General —</option>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                placeholder="e.g. Email frequency limits"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Content *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                placeholder="Governance policy text..."
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                placeholder="e.g. Frequency, Compliance"
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
