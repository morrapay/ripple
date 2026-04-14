"use client";

import { useState, useEffect, useCallback } from "react";
import {
  COMMUNICATION_TYPES,
  COMMUNICATION_CATEGORIES,
  PREFERENCE_GROUPS,
  CHANNEL_OPTIONS,
  getCommTypeConfig,
  getCategoryLabel,
  getPreferenceLabel,
  getChannelConfig,
  type CommType,
} from "@/lib/communication-constants";
import { CommunicationPreview } from "./communication-preview";
import { DependencyGraph } from "./dependency-graph";
import { AuditHistory } from "./audit-history";
import { CommentsPanel } from "./comments-panel";
import type { SuggestedContent } from "@/lib/ai/content-suggester";
import { validateContent } from "@/lib/services/content-validator";

type CommunicationStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "DEPRECATED" | "READY_FOR_BRAZE";

type ContentApprovalStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | null;

interface Communication {
  id: string;
  name: string;
  description: string | null;
  channel: string | null;
  communicationType: CommType | null;
  category: string | null;
  preferenceGroup: string | null;
  tags: string[];
  status: CommunicationStatus;
  contentApprovalStatus: ContentApprovalStatus;
  contentApprovedBy: string | null;
  contentApprovedAt: string | null;
  owner: string | null;
  communicationPoint: { id: string; name: string; triggerEvent: string | null } | null;
  template: { id: string; channel: string; name: string } | null;
  contentOutline: SuggestedContent | null;
  createdAt: string;
  updatedAt: string;
}

const APPROVAL_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const APPROVAL_COLORS: Record<string, string> = {
  PENDING_REVIEW: "bg-amber-500/20 text-amber-400",
  APPROVED: "bg-emerald-500/20 text-emerald-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

interface PendingPoint {
  id: string;
  name: string;
  triggerEvent: string | null;
  journeyStep: { id: string; name: string } | null;
}

const STATUS_LABELS: Record<CommunicationStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  DEPRECATED: "Deprecated",
  READY_FOR_BRAZE: "Ready for Braze",
};

const STATUS_COLORS: Record<CommunicationStatus, string> = {
  DRAFT: "bg-zinc-500/20 text-zinc-400",
  ACTIVE: "bg-emerald-500/20 text-emerald-400",
  PAUSED: "bg-amber-500/20 text-amber-400",
  DEPRECATED: "bg-red-500/20 text-red-400",
  READY_FOR_BRAZE: "bg-blue-500/20 text-blue-400",
};

export function CommunicationsManagement({ domainId }: { domainId: string }) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [pendingPoints, setPendingPoints] = useState<PendingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterChannel, setFilterChannel] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const [setupPoint, setSetupPoint] = useState<PendingPoint | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [mainTab, setMainTab] = useState<"communications" | "dependencies">("communications");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/domains/${domainId}/communications`);
      if (!res.ok) return;
      const data = await res.json();
      setCommunications(data.communications ?? []);
      setPendingPoints(data.pendingPoints ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [domainId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = communications.filter((c) => {
    if (filterChannel && c.channel !== filterChannel) return false;
    if (filterType && c.communicationType !== filterType) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return <div className="py-12 text-center text-zinc-500">Loading communications...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Main tab navigation */}
      <div className="flex gap-1 border-b border-zinc-800">
        <button
          onClick={() => setMainTab("communications")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mainTab === "communications" ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Communications
        </button>
        <button
          onClick={() => setMainTab("dependencies")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mainTab === "dependencies" ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Dependencies
        </button>
      </div>

      {mainTab === "dependencies" && (
        <DependencyGraph domainId={domainId} />
      )}

      {mainTab === "communications" && <>
      {/* Section 1: Incoming from Mapping */}
      {pendingPoints.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            Incoming from Mapping ({pendingPoints.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingPoints.map((pp) => (
              <div
                key={pp.id}
                className="rounded-lg border border-violet-500/30 bg-violet-950/20 px-4 py-3"
              >
                <p className="text-sm font-medium text-violet-200 truncate">{pp.name}</p>
                {pp.triggerEvent && (
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    Trigger: <code className="text-zinc-400">{pp.triggerEvent}</code>
                  </p>
                )}
                {pp.journeyStep && (
                  <p className="text-[10px] text-zinc-600 mt-1">
                    From step: {pp.journeyStep.name}
                  </p>
                )}
                <button
                  onClick={() => setSetupPoint(pp)}
                  className="mt-3 w-full px-3 py-1.5 rounded-md bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 transition-colors"
                >
                  Set up communication
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Filters + Add */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-muted)] transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Communication
        </button>
        <div className="w-px h-5 bg-zinc-700 mx-1" />
        <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} className="px-2.5 py-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-xs text-zinc-300">
          <option value="">All channels</option>
          {CHANNEL_OPTIONS.map((ch) => <option key={ch.value} value={ch.value}>{ch.label}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-2.5 py-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-xs text-zinc-300">
          <option value="">All types</option>
          {COMMUNICATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-2.5 py-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-xs text-zinc-300">
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABELS) as CommunicationStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <span className="text-xs text-zinc-600 ml-auto">{filtered.length} communication{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Section 3: Communications Table */}
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm">
            {communications.length === 0
              ? "No communications yet. Set up communication steps in the Mapping area first."
              : "No communications match the current filters."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Channel</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Preference</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((comm) => {
                const typeConfig = getCommTypeConfig(comm.communicationType);
                const channelConfig = getChannelConfig(comm.channel);
                return (
                  <tr
                    key={comm.id}
                    onClick={() => setSelectedComm(comm)}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-200 truncate max-w-[200px]">{comm.name}</p>
                      {comm.communicationPoint?.triggerEvent && (
                        <p className="text-[10px] text-zinc-600 mt-0.5 truncate">
                          Trigger: {comm.communicationPoint.triggerEvent}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {channelConfig ? (
                        <span className="flex items-center gap-1.5 text-zinc-300 text-xs">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-zinc-500">
                            <path d={channelConfig.icon} />
                          </svg>
                          {channelConfig.label}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {typeConfig ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{getCategoryLabel(comm.category) || "—"}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{getPreferenceLabel(comm.preferenceGroup) || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[comm.status]}`}>
                          {STATUS_LABELS[comm.status]}
                        </span>
                        {comm.contentApprovalStatus && (
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${APPROVAL_COLORS[comm.contentApprovalStatus] ?? ""}`}>
                            {APPROVAL_LABELS[comm.contentApprovalStatus] ?? comm.contentApprovalStatus}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedComm && (
        <DetailDrawer
          comm={selectedComm}
          domainId={domainId}
          onClose={() => setSelectedComm(null)}
          onUpdate={(updated) => {
            setCommunications((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setSelectedComm(updated);
          }}
        />
      )}

      {/* Setup Modal */}
      {setupPoint && (
        <SetupModal
          point={setupPoint}
          domainId={domainId}
          onClose={() => setSetupPoint(null)}
          onCreated={() => { setSetupPoint(null); fetchData(); }}
        />
      )}

      {/* Add Communication Modal */}
      {showAddModal && (
        <AddCommunicationModal
          domainId={domainId}
          onClose={() => setShowAddModal(false)}
          onCreated={() => { setShowAddModal(false); fetchData(); }}
        />
      )}
      </>}
    </div>
  );
}

/* ───── Detail Drawer ───── */

function DetailDrawer({
  comm, domainId, onClose, onUpdate,
}: {
  comm: Communication;
  domainId: string;
  onClose: () => void;
  onUpdate: (c: Communication) => void;
}) {
  const [tab, setTab] = useState<"overview" | "content">("overview");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [channel, setChannel] = useState(comm.channel ?? "");
  const [commType, setCommType] = useState<CommType | "">(comm.communicationType ?? "");
  const [category, setCategory] = useState(comm.category ?? "");
  const [prefGroup, setPrefGroup] = useState(comm.preferenceGroup ?? "");
  const [status, setStatus] = useState<CommunicationStatus>(comm.status);
  const [content, setContent] = useState<SuggestedContent | null>(comm.contentOutline as SuggestedContent | null);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    setChannel(comm.channel ?? "");
    setCommType(comm.communicationType ?? "");
    setCategory(comm.category ?? "");
    setPrefGroup(comm.preferenceGroup ?? "");
    setStatus(comm.status);
    setContent(comm.contentOutline as SuggestedContent | null);
  }, [comm.id]);

  async function save(extra?: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/domains/${domainId}/communications/${comm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: channel || null,
          communicationType: commType || null,
          category: category || null,
          preferenceGroup: prefGroup || null,
          status,
          ...extra,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.communication);
      }
    } finally {
      setSaving(false);
    }
  }

  async function suggestContentHandler() {
    setSuggesting(true);
    try {
      const res = await fetch(`/api/domains/${domainId}/communications/suggest-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: channel || "email",
          communicationType: commType || null,
          category: category || null,
          triggerEvent: comm.communicationPoint?.triggerEvent ?? null,
          commName: comm.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
        await save({ contentOutline: data.content });
      }
    } finally {
      setSuggesting(false);
    }
  }

  const tabs = [
    { id: "overview" as const, label: "Classification" },
    { id: "content" as const, label: "Content" },
  ];

  const filteredCategories = commType
    ? COMMUNICATION_CATEGORIES.filter((c) => c.types.includes(commType as CommType))
    : COMMUNICATION_CATEGORIES;

  const validationWarnings = validateContent(content, channel || comm.channel).warnings;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-lg bg-[var(--card)] border-l border-[var(--card-border)] h-full overflow-y-auto pt-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--card)] px-5 py-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="min-w-0 flex-1 text-base font-medium text-zinc-100 truncate">{comm.name}</h3>
            <button onClick={onClose} className="shrink-0 p-1 rounded hover:bg-zinc-800 text-zinc-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          {comm.communicationPoint?.triggerEvent && (
            <p className="text-xs text-zinc-500 mb-3">Trigger: <code className="text-zinc-400">{comm.communicationPoint.triggerEvent}</code></p>
          )}
          <div className="flex gap-1 border-b border-zinc-800">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  tab === t.id ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-5">
          {tab === "overview" && (
            <div className="space-y-5">
              <Field label="Channel">
                <select value={channel} onChange={(e) => setChannel(e.target.value)} className="input-field">
                  <option value="">Select channel...</option>
                  {CHANNEL_OPTIONS.map((ch) => <option key={ch.value} value={ch.value}>{ch.label}</option>)}
                </select>
              </Field>

              <Field label="Communication Type">
                <div className="grid grid-cols-3 gap-2">
                  {COMMUNICATION_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => { setCommType(t.value); if (category) { const cat = COMMUNICATION_CATEGORIES.find((c) => c.value === category); if (cat && !cat.types.includes(t.value)) setCategory(""); } }}
                      className={`px-2 py-2 rounded-lg border text-xs text-center transition-all ${
                        commType === t.value ? t.color + " font-medium" : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {commType && (
                  <p className="text-[10px] text-zinc-600 mt-1.5">{COMMUNICATION_TYPES.find((t) => t.value === commType)?.description}</p>
                )}
              </Field>

              <Field label="Category">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
                  <option value="">Select category...</option>
                  {filteredCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>

              <Field label="Preference Group">
                <select value={prefGroup} onChange={(e) => setPrefGroup(e.target.value)} className="input-field">
                  <option value="">Select preference group...</option>
                  {PREFERENCE_GROUPS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}{!p.canOptOut ? " (mandatory)" : ""}</option>
                  ))}
                </select>
                {prefGroup && (
                  <p className="text-[10px] text-zinc-600 mt-1.5">
                    {PREFERENCE_GROUPS.find((p) => p.value === prefGroup)?.description}
                    {PREFERENCE_GROUPS.find((p) => p.value === prefGroup)?.canOptOut === false && (
                      <span className="text-amber-500 ml-1">• Users cannot opt out</span>
                    )}
                  </p>
                )}
              </Field>

              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value as CommunicationStatus)} className="input-field">
                  {(Object.keys(STATUS_LABELS) as CommunicationStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </Field>

              <button
                onClick={() => save()}
                disabled={saving}
                className="w-full py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Classification"}
              </button>
            </div>
          )}

          {tab === "content" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">AI-suggested content based on classification</p>
                <button
                  onClick={suggestContentHandler}
                  disabled={suggesting}
                  className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50 transition-colors"
                >
                  {suggesting ? "Generating..." : content ? "Regenerate" : "Suggest Content"}
                </button>
              </div>

              {content ? (
                <div className="space-y-4">
                  <ContentField label="Subject" value={content.subject} onChange={(v) => setContent({ ...content, subject: v })} />
                  <ContentField label="Headline" value={content.headline} onChange={(v) => setContent({ ...content, headline: v })} />
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">Body</label>
                    <textarea
                      value={content.body}
                      onChange={(e) => setContent({ ...content, body: e.target.value })}
                      rows={6}
                      className="input-field resize-none"
                    />
                  </div>
                  <ContentField label="CTA Text" value={content.ctaText} onChange={(v) => setContent({ ...content, ctaText: v })} />
                  <ContentField label="CTA Link" value={content.ctaLink} onChange={(v) => setContent({ ...content, ctaLink: v })} />
                  {content.footer && (
                    <ContentField label="Footer" value={content.footer} onChange={(v) => setContent({ ...content, footer: v })} />
                  )}
                  <button
                    onClick={() => save({ contentOutline: content })}
                    disabled={saving}
                    className="w-full py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Saving..." : "Save Content"}
                  </button>

                  <button
                    onClick={() => setShowPreview(true)}
                    disabled={!channel}
                    className="w-full py-2.5 rounded-md border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Preview Communication
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center text-zinc-600 text-sm">
                  <p>Click &quot;Suggest Content&quot; to generate content based on the communication&apos;s classification.</p>
                  {channel && (
                    <button
                      onClick={() => setShowPreview(true)}
                      className="mt-4 px-4 py-2 rounded-md border border-zinc-700 text-zinc-400 text-xs font-medium hover:bg-zinc-800 hover:border-zinc-600 transition-colors inline-flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Preview with defaults
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Approval Workflow Section */}
          <div className="border-t border-zinc-800 px-5 py-4 space-y-3">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Content Approval</p>
            
            {comm.contentApprovalStatus && (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${APPROVAL_COLORS[comm.contentApprovalStatus] ?? ""}`}>
                  {APPROVAL_LABELS[comm.contentApprovalStatus] ?? comm.contentApprovalStatus}
                </span>
                {comm.contentApprovedBy && (
                  <span className="text-[10px] text-zinc-500">by {comm.contentApprovedBy}</span>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {(!comm.contentApprovalStatus || comm.contentApprovalStatus === "REJECTED") && (
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/domains/${domainId}/communications/${comm.id}/submit-review`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                    });
                    if (res.ok) {
                      const data = await res.json();
                      onUpdate(data.communication);
                    }
                  }}
                  className="px-3 py-1.5 rounded-md bg-amber-600 text-white text-xs font-medium hover:bg-amber-500 transition-colors"
                >
                  Submit for Review
                </button>
              )}

              {comm.contentApprovalStatus === "PENDING_REVIEW" && (
                <>
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/domains/${domainId}/communications/${comm.id}/approve`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ approvedBy: "Admin" }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        onUpdate(data.communication);
                      }
                    }}
                    className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={async () => {
                      const reason = prompt("Rejection reason (optional):");
                      const res = await fetch(`/api/domains/${domainId}/communications/${comm.id}/reject`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ reason }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        onUpdate(data.communication);
                      }
                    }}
                    className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-500 transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}

              {comm.contentApprovalStatus === "APPROVED" && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
                  Content approved — Jira tickets created
                </span>
              )}
            </div>
          </div>

          {/* Braze Export Button */}
          <div className="border-t border-zinc-800 px-5 py-4">
            <button
              onClick={() => window.open(`/api/domains/${domainId}/export/braze?format=download`, "_blank")}
              className="w-full py-2 rounded-md border border-zinc-700 text-zinc-400 text-xs font-medium hover:bg-zinc-800 hover:border-zinc-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export for Braze
            </button>
          </div>

          {/* Test Send */}
          {(channel === "email" || channel === "sms" || channel === "push" || comm.channel === "email" || comm.channel === "sms" || comm.channel === "push") && (
            <div className="border-t border-zinc-800 px-5 py-4">
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-3">Test Send</p>
              <button
                onClick={async () => {
                  const recipient = prompt("Enter recipient email:");
                  if (!recipient) return;
                  const res = await fetch(`/api/domains/${domainId}/communications/${comm.id}/test-send`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ recipientEmail: recipient }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    alert(data.message);
                  }
                }}
                className="w-full py-2 rounded-md border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-zinc-800 hover:border-zinc-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send Test
              </button>
            </div>
          )}

          {/* Content Validation */}
          <div className="border-t border-zinc-800 px-5 py-4">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-3">Content Validation</p>
            {!content ? (
              <p className="text-xs text-zinc-500">Add or save content to run validation.</p>
            ) : validationWarnings.length === 0 ? (
              <p className="text-xs text-emerald-400/90">No issues found.</p>
            ) : (
              <ul className="space-y-2">
                {validationWarnings.map((w, i) => (
                  <li key={`${w.field}-${i}`} className={`text-xs ${w.severity === "error" ? "text-red-400" : "text-amber-400/90"}`}>
                    <span className="font-medium">{w.field}:</span> {w.message}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* History & Comments */}
          <div className="border-t border-zinc-800 px-5 py-4 space-y-3">
            <AuditHistory domainId={domainId} entityType="COMMUNICATION" entityId={comm.id} />
            <CommentsPanel domainId={domainId} entityType="COMMUNICATION" entityId={comm.id} />
          </div>
        </div>
      </div>

      {/* Full-screen Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowPreview(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative max-h-[90vh] overflow-y-auto rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-zinc-900 border-b border-zinc-800">
              <p className="text-sm font-medium text-zinc-300">{comm.name} — Preview</p>
              <button onClick={() => setShowPreview(false)} className="p-1 rounded hover:bg-zinc-800 text-zinc-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <CommunicationPreview
                channel={channel}
                content={content}
                commName={comm.name}
                communicationType={commType as CommType || comm.communicationType}
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          border: 1px solid rgb(63 63 70);
          background: rgb(24 24 27);
          font-size: 0.875rem;
          color: rgb(228 228 231);
          transition: border-color 0.15s;
        }
        .input-field:focus {
          outline: none;
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}

/* ───── Setup Modal (from pending point) ───── */

function SetupModal({
  point, domainId, onClose, onCreated,
}: {
  point: PendingPoint;
  domainId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState(point.name);
  const [channel, setChannel] = useState("");
  const [commType, setCommType] = useState<CommType | "">("");
  const [category, setCategory] = useState("");
  const [prefGroup, setPrefGroup] = useState("");
  const [creating, setCreating] = useState(false);

  const filteredCategories = commType
    ? COMMUNICATION_CATEGORIES.filter((c) => c.types.includes(commType as CommType))
    : COMMUNICATION_CATEGORIES;

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch(`/api/domains/${domainId}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          communicationPointId: point.id,
          channel: channel || null,
          communicationType: commType || null,
          category: category || null,
          preferenceGroup: prefGroup || null,
        }),
      });
      if (res.ok) onCreated();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-800">
          <h3 className="text-base font-medium text-zinc-100">Set up communication</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            From mapping: <span className="text-zinc-400">{point.name}</span>
            {point.triggerEvent && <> — trigger: <code className="text-zinc-400">{point.triggerEvent}</code></>}
          </p>
        </div>

        <div className="px-5 py-5 space-y-4">
          <Field label="Name">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none" />
          </Field>

          <Field label="Channel">
            <div className="grid grid-cols-4 gap-1.5">
              {CHANNEL_OPTIONS.map((ch) => (
                <button
                  key={ch.value}
                  onClick={() => setChannel(ch.value)}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-[10px] transition-all ${
                    channel === ch.value ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d={ch.icon} />
                  </svg>
                  <span className="truncate w-full text-center">{ch.label}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Type">
            <div className="grid grid-cols-3 gap-2">
              {COMMUNICATION_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setCommType(t.value); if (category) { const cat = COMMUNICATION_CATEGORIES.find((c) => c.value === category); if (cat && !cat.types.includes(t.value)) setCategory(""); } }}
                  className={`px-2 py-2 rounded-lg border text-xs text-center transition-all ${
                    commType === t.value ? t.color + " font-medium" : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none">
              <option value="">Select category...</option>
              {filteredCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>

          <Field label="Preference Group">
            <select value={prefGroup} onChange={(e) => setPrefGroup(e.target.value)} className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none">
              <option value="">Select preference group...</option>
              {PREFERENCE_GROUPS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}{!p.canOptOut ? " (mandatory)" : ""}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="px-5 py-4 border-t border-zinc-800 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-md border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="flex-1 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating..." : "Create Communication"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───── Add Communication Modal (manual) ───── */

function AddCommunicationModal({
  domainId, onClose, onCreated,
}: {
  domainId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("");
  const [commType, setCommType] = useState<CommType | "">("");
  const [category, setCategory] = useState("");
  const [prefGroup, setPrefGroup] = useState("");
  const [creating, setCreating] = useState(false);

  const filteredCategories = commType
    ? COMMUNICATION_CATEGORIES.filter((c) => c.types.includes(commType as CommType))
    : COMMUNICATION_CATEGORIES;

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch(`/api/domains/${domainId}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Untitled",
          channel: channel || null,
          communicationType: commType || null,
          category: category || null,
          preferenceGroup: prefGroup || null,
        }),
      });
      if (res.ok) onCreated();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-800">
          <h3 className="text-base font-medium text-zinc-100">Add Communication</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Create a new communication manually</p>
        </div>

        <div className="px-5 py-5 space-y-4">
          <Field label="Name">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Welcome email" className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none" />
          </Field>

          <Field label="Channel">
            <div className="grid grid-cols-4 gap-1.5">
              {CHANNEL_OPTIONS.map((ch) => (
                <button
                  key={ch.value}
                  onClick={() => setChannel(ch.value)}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-[10px] transition-all ${
                    channel === ch.value ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d={ch.icon} />
                  </svg>
                  <span className="truncate w-full text-center">{ch.label}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Type">
            <div className="grid grid-cols-3 gap-2">
              {COMMUNICATION_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setCommType(t.value); if (category) { const cat = COMMUNICATION_CATEGORIES.find((c) => c.value === category); if (cat && !cat.types.includes(t.value)) setCategory(""); } }}
                  className={`px-2 py-2 rounded-lg border text-xs text-center transition-all ${
                    commType === t.value ? t.color + " font-medium" : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none">
              <option value="">Select category...</option>
              {filteredCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>

          <Field label="Preference Group">
            <select value={prefGroup} onChange={(e) => setPrefGroup(e.target.value)} className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none">
              <option value="">Select preference group...</option>
              {PREFERENCE_GROUPS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}{!p.canOptOut ? " (mandatory)" : ""}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="px-5 py-4 border-t border-zinc-800 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-md border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="flex-1 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating..." : "Create Communication"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───── Helpers ───── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ContentField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none transition-colors"
      />
    </div>
  );
}
