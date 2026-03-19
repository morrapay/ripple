"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Domain {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
}

export function DomainSelector() {
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingTagsForId, setEditingTagsForId] = useState<string | null>(null);
  const [editTagsValue, setEditTagsValue] = useState("");
  const [savingTags, setSavingTags] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTags, setNewTags] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parseTags = (s: string) =>
    s
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean);

  useEffect(() => {
    fetch("/api/domains")
      .then((res) => res.json())
      .then((data) => {
        const domainsList = (data.domains ?? []).map((d: { tags?: string[] }) => ({
          ...d,
          tags: Array.isArray(d.tags) ? d.tags : [],
        }));
        setDomains(domainsList);
        if (domainsList.length > 0 && !selectedId) {
          setSelectedId(domainsList[0].id);
        }
      })
      .catch(() => setError("Failed to load domains"))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = () => {
    if (selectedId) {
      router.push(`/domain/${selectedId}/dashboard`);
    }
  };

  const handleSaveTags = async (domainId: string) => {
    setSavingTags(true);
    setError(null);
    try {
      const res = await fetch(`/api/domains/${domainId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: parseTags(editTagsValue) }),
      });
      if (!res.ok) throw new Error("Failed to update tags");
      const data = await res.json();
      const updatedTags = Array.isArray(data.domain?.tags) ? data.domain.tags : [];
      setDomains((prev) =>
        prev.map((d) => (d.id === domainId ? { ...d, tags: updatedTags } : d))
      );
      setEditingTagsForId(null);
      setEditTagsValue("");
    } catch {
      setError("Failed to update tags");
    } finally {
      setSavingTags(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    const payload = {
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      tags: parseTags(newTags),
    };
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const rawText = await res.text();
      let data: { domain?: { id: string }; error?: string };
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(`Server returned non-JSON: ${rawText.slice(0, 80)}`);
      }
      if (!res.ok) throw new Error(data.error ?? "Failed to create domain");
      router.push(`/domain/${data.domain!.id}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create domain");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6 animate-pulse">
        <div className="h-10 bg-zinc-700 rounded mb-4" />
        <div className="h-10 bg-zinc-700 rounded" />
      </div>
    );
  }

  if (showCreate) {
    return (
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium mb-4">Create new domain</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Receiving accounts, Withdraw to Bank"
              className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Description (optional)</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Brief description of the domain"
              rows={2}
              className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Tags (optional)</label>
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="e.g. Commercial Products, BizApps, CLM, Wallet"
              className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-md bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setNewName("");
                setNewDescription("");
                setNewTags("");
                setError(null);
              }}
              className="px-4 py-2 rounded-md border border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6 space-y-4">
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Select domain</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          {domains.length === 0 ? (
            <option value="">No domains yet</option>
          ) : (
            domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))
          )
        }
        </select>
        {selectedId && (() => {
          const selected = domains.find((d) => d.id === selectedId);
          const tags = selected?.tags ?? [];
          const isEditing = editingTagsForId === selectedId;
          return (
            <div className="mt-2">
              {isEditing ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editTagsValue}
                    onChange={(e) => setEditTagsValue(e.target.value)}
                    placeholder="e.g. Commercial Products, BizApps, CLM, Wallet"
                    className="flex-1 px-2 py-1 text-sm rounded bg-zinc-900 border border-zinc-700 text-[var(--foreground)]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveTags(selectedId)}
                    disabled={savingTags}
                    className="text-xs px-2 py-1 rounded bg-[var(--accent)] text-white disabled:opacity-50"
                  >
                    {savingTags ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTagsForId(null);
                      setEditTagsValue("");
                    }}
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1 items-center">
                  {tags.length > 0 && tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTagsForId(selectedId);
                      setEditTagsValue(tags.join(", "));
                    }}
                    className="text-xs text-[var(--accent)] hover:underline"
                  >
                    {tags.length > 0 ? "Edit tags" : "+ Add tags"}
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSelect}
          disabled={!selectedId}
          className="px-4 py-2 rounded-md bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50"
        >
          Open dashboard
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-md border border-zinc-600 text-zinc-300 hover:bg-zinc-800"
        >
          Create new domain
        </button>
      </div>
    </div>
  );
}
