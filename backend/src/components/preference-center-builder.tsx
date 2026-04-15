"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ICON_OPTIONS = ["📧", "📱", "🔔", "💳", "📣", "✉️", "🎯", "⭐", "📊", "🛡️"];

type PreferenceCategory = {
  id: string;
  name: string;
  description: string | null;
  canOptOut: boolean;
  mandatory: boolean;
  displayOrder: number;
  icon: string | null;
};

type CommRow = {
  id: string;
  name: string;
  channel: string | null;
  preferenceCategories: string[];
};

type TabId = "categories" | "mapping" | "preview";

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function PreferenceCenterBuilder({ domainId }: { domainId: string }) {
  const [tab, setTab] = useState<TabId>("categories");
  const [categories, setCategories] = useState<PreferenceCategory[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [communications, setCommunications] = useState<CommRow[]>([]);
  const [commLoading, setCommLoading] = useState(false);
  const [mappingDraft, setMappingDraft] = useState<Record<string, string[]>>({});
  const [mappingBaseline, setMappingBaseline] = useState<Record<string, string[]>>({});
  const [mappingSaving, setMappingSaving] = useState(false);
  const [mappingMessage, setMappingMessage] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCanOptOut, setNewCanOptOut] = useState(true);
  const [newMandatory, setNewMandatory] = useState(false);
  const [newIcon, setNewIcon] = useState<string | null>(null);
  const [newSubmitting, setNewSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<PreferenceCategory>>({});

  const [previewViewport, setPreviewViewport] = useState<"web" | "mobile">("web");
  const [previewOptIn, setPreviewOptIn] = useState<Record<string, boolean>>({});

  const base = `/api/domains/${domainId}`;

  const fetchCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const res = await fetch(`${base}/preference-categories`);
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data.categories ?? []);
    } finally {
      setCatLoading(false);
    }
  }, [base]);

  const fetchCommunications = useCallback(async () => {
    setCommLoading(true);
    try {
      const res = await fetch(`${base}/communications`);
      if (!res.ok) return;
      const data = await res.json();
      const list = (data.communications ?? []) as Array<{
        id: string;
        name: string;
        channel: string | null;
        preferenceCategories: string[];
      }>;
      const rows: CommRow[] = list.map((c) => ({
        id: c.id,
        name: c.name,
        channel: c.channel,
        preferenceCategories: Array.isArray(c.preferenceCategories)
          ? c.preferenceCategories
          : [],
      }));
      setCommunications(rows);
      const draft: Record<string, string[]> = {};
      const baseMap: Record<string, string[]> = {};
      for (const r of rows) {
        draft[r.id] = [...r.preferenceCategories];
        baseMap[r.id] = [...r.preferenceCategories];
      }
      setMappingDraft(draft);
      setMappingBaseline(baseMap);
    } finally {
      setCommLoading(false);
    }
  }, [base]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (tab === "mapping") fetchCommunications();
  }, [tab, fetchCommunications]);

  useEffect(() => {
    setPreviewOptIn((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const c of categories) {
        if (!c.mandatory && c.canOptOut && next[c.id] === undefined) {
          next[c.id] = true;
        }
      }
      for (const k of Object.keys(next)) {
        if (!categories.some((c) => c.id === k)) delete next[k];
      }
      return next;
    });
  }, [categories]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.displayOrder - b.displayOrder),
    [categories]
  );

  const mandatoryCats = useMemo(
    () => sortedCategories.filter((c) => c.mandatory),
    [sortedCategories]
  );
  const optionalCats = useMemo(
    () => sortedCategories.filter((c) => !c.mandatory),
    [sortedCategories]
  );

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || newSubmitting) return;
    setNewSubmitting(true);
    try {
      const res = await fetch(`${base}/preference-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: newDescription.trim() || undefined,
          canOptOut: newCanOptOut,
          mandatory: newMandatory,
          icon: newIcon ?? undefined,
        }),
      });
      if (!res.ok) return;
      setNewName("");
      setNewDescription("");
      setNewCanOptOut(true);
      setNewMandatory(false);
      setNewIcon(null);
      await fetchCategories();
    } finally {
      setNewSubmitting(false);
    }
  }

  async function handleDelete(cat: PreferenceCategory) {
    if (!confirm(`Delete category “${cat.name}”?`)) return;
    const res = await fetch(`${base}/preference-categories/${cat.id}`, {
      method: "DELETE",
    });
    if (res.ok) await fetchCategories();
  }

  function startEdit(cat: PreferenceCategory) {
    setEditingId(cat.id);
    setEditDraft({
      name: cat.name,
      description: cat.description,
      canOptOut: cat.canOptOut,
      mandatory: cat.mandatory,
      icon: cat.icon,
      displayOrder: cat.displayOrder,
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    const res = await fetch(`${base}/preference-categories/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    if (res.ok) {
      setEditingId(null);
      setEditDraft({});
      await fetchCategories();
    }
  }

  async function moveCategory(cat: PreferenceCategory, dir: -1 | 1) {
    const idx = sortedCategories.findIndex((c) => c.id === cat.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sortedCategories.length) return;
    const other = sortedCategories[swapIdx];
    await Promise.all([
      fetch(`${base}/preference-categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayOrder: other.displayOrder }),
      }),
      fetch(`${base}/preference-categories/${other.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayOrder: cat.displayOrder }),
      }),
    ]);
    await fetchCategories();
  }

  function toggleMappingCategory(commId: string, catId: string, checked: boolean) {
    setMappingDraft((prev) => {
      const cur = new Set(prev[commId] ?? []);
      if (checked) cur.add(catId);
      else cur.delete(catId);
      return { ...prev, [commId]: Array.from(cur) };
    });
  }

  const mappingDirty = useMemo(() => {
    for (const c of communications) {
      const a = (mappingDraft[c.id] ?? []).slice().sort().join(",");
      const b = (mappingBaseline[c.id] ?? []).slice().sort().join(",");
      if (a !== b) return true;
    }
    return false;
  }, [communications, mappingDraft, mappingBaseline]);

  async function saveMapping() {
    setMappingSaving(true);
    setMappingMessage(null);
    try {
      const updates: Promise<Response>[] = [];
      for (const c of communications) {
        const next = mappingDraft[c.id] ?? [];
        const baseline = mappingBaseline[c.id] ?? [];
        const same =
          next.length === baseline.length &&
          next.every((id) => baseline.includes(id)) &&
          baseline.every((id) => next.includes(id));
        if (same) continue;
        updates.push(
          fetch(`${base}/communications/${c.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ preferenceCategories: next }),
          })
        );
      }
      const results = await Promise.all(updates);
      const failed = results.filter((r) => !r.ok);
      if (failed.length) {
        setMappingMessage("Some updates failed. Try again.");
        return;
      }
      setMappingBaseline(
        Object.fromEntries(
          communications.map((c) => [c.id, [...(mappingDraft[c.id] ?? [])]])
        )
      );
      setMappingMessage("Saved.");
    } catch {
      setMappingMessage("Save failed.");
    } finally {
      setMappingSaving(false);
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "categories", label: "Categories" },
    { id: "mapping", label: "Communication Mapping" },
    { id: "preview", label: "Preview" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Preference Center</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Define categories and map communications for the customer preference center.
        </p>
      </div>

      <div className="flex gap-1 p-1 rounded-lg bg-zinc-900/80 border border-[var(--card-border)] w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              tab === t.id
                ? "bg-[var(--accent)]/20 text-[var(--accent)] font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "categories" && (
        <div className="space-y-8">
          <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
            <h2 className="text-sm font-medium text-zinc-300 mb-4">Add category</h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs text-zinc-500">Name</span>
                  <input
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-md border border-[var(--card-border)] bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                    placeholder="e.g. Marketing emails"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs text-zinc-500">Icon</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewIcon(null)}
                      className={`h-9 px-2 rounded-md text-xs border ${
                        newIcon === null
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "border-[var(--card-border)] text-zinc-500 hover:border-zinc-600"
                      }`}
                    >
                      None
                    </button>
                    {ICON_OPTIONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setNewIcon(ic)}
                        className={`h-9 w-9 rounded-md text-lg leading-none border ${
                          newIcon === ic
                            ? "border-[var(--accent)] bg-[var(--accent)]/10"
                            : "border-[var(--card-border)] hover:border-zinc-600"
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs text-zinc-500">Description</span>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-[var(--card-border)] bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                  placeholder="Short description shown to customers"
                />
              </label>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCanOptOut}
                    onChange={(e) => setNewCanOptOut(e.target.checked)}
                    className="rounded border-zinc-600 bg-zinc-900 text-[var(--accent)] focus:ring-[var(--accent)]/40"
                  />
                  <span className="text-sm text-zinc-300">Customer can opt out</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMandatory}
                    onChange={(e) => setNewMandatory(e.target.checked)}
                    className="rounded border-zinc-600 bg-zinc-900 text-[var(--accent)] focus:ring-[var(--accent)]/40"
                  />
                  <span className="text-sm text-zinc-300">Mandatory</span>
                </label>
              </div>
              <button
                type="submit"
                disabled={newSubmitting || !newName.trim()}
                className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-muted)] disabled:opacity-50"
              >
                {newSubmitting ? "Adding…" : "Add category"}
              </button>
            </form>
          </section>

          <section>
            <h2 className="text-sm font-medium text-zinc-300 mb-3">Your categories</h2>
            {catLoading ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : sortedCategories.length === 0 ? (
              <p className="text-sm text-zinc-500">No categories yet.</p>
            ) : (
              <ul className="space-y-3">
                {sortedCategories.map((cat, i) => (
                  <li
                    key={cat.id}
                    className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4"
                  >
                    {editingId === cat.id ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            value={editDraft.name ?? ""}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, name: e.target.value }))
                            }
                            className="rounded-md border border-[var(--card-border)] bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100"
                          />
                          <div className="flex flex-wrap gap-1">
                            {ICON_OPTIONS.map((ic) => (
                              <button
                                key={ic}
                                type="button"
                                onClick={() =>
                                  setEditDraft((d) => ({ ...d, icon: ic }))
                                }
                                className={`h-8 w-8 rounded text-base ${
                                  editDraft.icon === ic
                                    ? "ring-2 ring-[var(--accent)]"
                                    : ""
                                }`}
                              >
                                {ic}
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          value={editDraft.description ?? ""}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              description: e.target.value,
                            }))
                          }
                          rows={2}
                          className="w-full rounded-md border border-[var(--card-border)] bg-zinc-950/50 px-3 py-2 text-sm"
                        />
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm text-zinc-300">
                            <input
                              type="checkbox"
                              checked={editDraft.canOptOut ?? true}
                              onChange={(e) =>
                                setEditDraft((d) => ({
                                  ...d,
                                  canOptOut: e.target.checked,
                                }))
                              }
                            />
                            Can opt out
                          </label>
                          <label className="flex items-center gap-2 text-sm text-zinc-300">
                            <input
                              type="checkbox"
                              checked={editDraft.mandatory ?? false}
                              onChange={(e) =>
                                setEditDraft((d) => ({
                                  ...d,
                                  mandatory: e.target.checked,
                                }))
                              }
                            />
                            Mandatory
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="px-3 py-1.5 rounded-md text-sm bg-[var(--accent)] text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditDraft({});
                            }}
                            className="px-3 py-1.5 rounded-md text-sm border border-[var(--card-border)] text-zinc-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                        <div className="flex gap-3 min-w-0">
                          {cat.icon && (
                            <span className="text-2xl shrink-0" aria-hidden>
                              {cat.icon}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-100 truncate">
                              {cat.name}
                            </p>
                            {cat.description && (
                              <p className="text-sm text-zinc-500 mt-0.5">
                                {cat.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {cat.mandatory ? (
                                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  Mandatory
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-zinc-700/50 text-zinc-400 border border-zinc-600/50">
                                  Optional
                                </span>
                              )}
                              {cat.canOptOut ? (
                                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  Opt-out allowed
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-zinc-700/50 text-zinc-400 border border-zinc-600/50">
                                  No opt-out
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            title="Move up"
                            disabled={i === 0}
                            onClick={() => moveCategory(cat, -1)}
                            className="p-2 rounded-md border border-[var(--card-border)] text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            title="Move down"
                            disabled={i === sortedCategories.length - 1}
                            onClick={() => moveCategory(cat, 1)}
                            className="p-2 rounded-md border border-[var(--card-border)] text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="px-3 py-1.5 rounded-md text-sm border border-[var(--card-border)] text-zinc-300 hover:bg-zinc-800/50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            className="px-3 py-1.5 rounded-md text-sm text-red-400 hover:bg-red-950/30"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "mapping" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!mappingDirty || mappingSaving}
              onClick={saveMapping}
              className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-muted)] disabled:opacity-40"
            >
              {mappingSaving ? "Saving…" : "Save changes"}
            </button>
            {mappingMessage && (
              <span className="text-sm text-zinc-500">{mappingMessage}</span>
            )}
          </div>
          {commLoading ? (
            <p className="text-sm text-zinc-500">Loading communications…</p>
          ) : (
            <div className="rounded-xl border border-[var(--card-border)] overflow-hidden">
              <div>
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-[var(--card-border)] bg-zinc-900/50">
                      <th className="px-4 py-3 font-medium text-zinc-400">
                        Communication name
                      </th>
                      <th className="px-4 py-3 font-medium text-zinc-400">Channel</th>
                      <th className="px-4 py-3 font-medium text-zinc-400 min-w-[240px]">
                        Preference categories
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {communications.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-[var(--card-border)]/80 last:border-0"
                      >
                        <td className="px-4 py-3 text-zinc-200 font-medium">
                          {row.name}
                        </td>
                        <td className="px-4 py-3 text-zinc-500">
                          {row.channel ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <CategoryMultiSelect
                            categories={sortedCategories}
                            selected={mappingDraft[row.id] ?? []}
                            onToggle={(catId, checked) =>
                              toggleMappingCategory(row.id, catId, checked)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {communications.length === 0 && (
                <p className="p-6 text-sm text-zinc-500 text-center">
                  No communications in this domain.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "preview" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPreviewViewport("web")}
              className={`px-3 py-1.5 rounded-md text-sm ${
                previewViewport === "web"
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "text-zinc-400 border border-[var(--card-border)]"
              }`}
            >
              Web
            </button>
            <button
              type="button"
              onClick={() => setPreviewViewport("mobile")}
              className={`px-3 py-1.5 rounded-md text-sm ${
                previewViewport === "mobile"
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "text-zinc-400 border border-[var(--card-border)]"
              }`}
            >
              Mobile
            </button>
          </div>
          <div
            className={`mx-auto transition-all rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 ${
              previewViewport === "mobile" ? "max-w-sm" : "max-w-xl"
            }`}
          >
            <h3 className="text-lg font-semibold text-zinc-100 mb-1">
              Communication preferences
            </h3>
            <p className="text-xs text-zinc-500 mb-6">
              Mock preview — how customers may see your preference center.
            </p>
            {mandatoryCats.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
                  Always on
                </p>
                <ul className="space-y-2">
                  {mandatoryCats.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700/50 bg-zinc-950/40 px-3 py-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {c.icon && <span className="text-lg shrink-0">{c.icon}</span>}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-200 truncate">
                            {c.name}
                          </p>
                          {c.description && (
                            <p className="text-xs text-zinc-500 truncate">
                              {c.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-amber-400/90">
                        <LockIcon className="w-4 h-4" />
                        <span className="text-[10px] font-medium uppercase tracking-wide">
                          Always on
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {optionalCats.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
                  Optional
                </p>
                <ul className="space-y-2">
                  {optionalCats.map((c) => {
                    const on =
                      c.canOptOut === false ? true : (previewOptIn[c.id] ?? true);
                    return (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[var(--card-border)] bg-zinc-950/30 px-3 py-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {c.icon && <span className="text-lg shrink-0">{c.icon}</span>}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">
                              {c.name}
                            </p>
                            {c.description && (
                              <p className="text-xs text-zinc-500 truncate">
                                {c.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {c.canOptOut ? (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={on}
                            onClick={() =>
                              setPreviewOptIn((prev) => ({
                                ...prev,
                                [c.id]: !on,
                              }))
                            }
                            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                              on ? "bg-[var(--accent)]" : "bg-zinc-700"
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                on ? "left-6" : "left-1"
                              }`}
                            />
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-500">Fixed</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {sortedCategories.length === 0 && (
              <p className="text-sm text-zinc-500">
                Add categories in the Categories tab to preview them here.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryMultiSelect({
  categories,
  selected,
  onToggle,
}: {
  categories: PreferenceCategory[];
  selected: string[];
  onToggle: (catId: string, checked: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedNames = categories.filter((c) => selectedSet.has(c.id)).map((c) => c.name);
  const label = selectedNames.length === 0
    ? "Select categories…"
    : selectedNames.length <= 2
      ? selectedNames.join(", ")
      : `${selectedNames.length} selected`;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function toggleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen((o) => !o);
  }

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        className="w-full text-left rounded-md border border-[var(--card-border)] bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-600 truncate"
      >
        {label}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`inline-block ml-1 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] max-h-56 overflow-y-auto rounded-md border border-[var(--card-border)] bg-zinc-950 shadow-2xl py-1"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          {categories.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-500">No categories</p>
          ) : (
            categories.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(c.id)}
                  onChange={(e) => onToggle(c.id, e.target.checked)}
                  className="rounded border-zinc-600 bg-zinc-900 text-[var(--accent)]"
                />
                <span className="text-sm text-zinc-200 truncate">{c.name}</span>
              </label>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
