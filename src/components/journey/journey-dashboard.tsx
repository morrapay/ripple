"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CommentsPanel } from "../comments-panel";

type StepKind = "ACTION" | "SYSTEM_TRIGGER" | "COMMUNICATION" | "STATE";

interface JourneySummary {
  id: string;
  name: string;
  description: string | null;
  audience: string | null;
  objective: string | null;
  createdAt: string;
  updatedAt: string;
  steps: {
    id: string;
    behavioralEvents: { behavioralEventId: string }[];
    applicationEvents: { applicationEventId: string }[];
    communicationPoints: { id: string }[];
  }[];
}

interface JourneyDashboardProps {
  domainId: string;
}

const KIND_DOTS: { kind: StepKind; color: string; label: string }[] = [
  { kind: "ACTION", color: "bg-amber-500", label: "Actions" },
  { kind: "SYSTEM_TRIGGER", color: "bg-blue-500", label: "System" },
  { kind: "COMMUNICATION", color: "bg-violet-500", label: "Comms" },
  { kind: "STATE", color: "bg-zinc-400", label: "States" },
];

function getStepKindCounts(journey: JourneySummary) {
  const counts: Record<StepKind, number> = {
    ACTION: 0,
    SYSTEM_TRIGGER: 0,
    COMMUNICATION: 0,
    STATE: 0,
  };
  for (const step of journey.steps) {
    if (step.behavioralEvents.length > 0) counts.ACTION++;
    else if (step.applicationEvents.length > 0) counts.SYSTEM_TRIGGER++;
    else if (step.communicationPoints.length > 0) counts.COMMUNICATION++;
    else counts.STATE++;
  }
  return counts;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function JourneyDashboard({ domainId }: JourneyDashboardProps) {
  const router = useRouter();
  const [journeys, setJourneys] = useState<JourneySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEvents, setHasEvents] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("New Journey");
  const [newAudience, setNewAudience] = useState("");
  const [newObjective, setNewObjective] = useState("");

  useEffect(() => {
    fetchData();
  }, [domainId]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [journeysRes, behavioralRes, applicationRes] = await Promise.all([
        fetch(`/api/domains/${domainId}/journeys`),
        fetch(`/api/domains/${domainId}/behavioral-events`),
        fetch(`/api/domains/${domainId}/application-events`),
      ]);
      if (!journeysRes.ok) throw new Error("Failed to fetch journeys");
      const jData = await journeysRes.json();
      setJourneys(jData.journeys ?? []);

      const bData = await behavioralRes.json().catch(() => ({ events: [] }));
      const aData = await applicationRes.json().catch(() => ({ events: [] }));
      setHasEvents(
        (bData.events?.length ?? 0) > 0 || (aData.events?.length ?? 0) > 0
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    try {
      setGenerating(true);
      setError(null);
      const res = await fetch(`/api/domains/${domainId}/flow-mapping`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate");
      await fetchData();
      if (data.journey?.id) {
        router.push(`/domain/${domainId}/mapping/${data.journey.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCreateBlank() {
    try {
      setCreating(true);
      setError(null);
      const res = await fetch(`/api/domains/${domainId}/journeys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim() || "New Journey",
          audience: newAudience.trim() || undefined,
          objective: newObjective.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      setShowCreateModal(false);
      setNewName("New Journey");
      setNewAudience("");
      setNewObjective("");
      router.push(`/domain/${domainId}/mapping/${data.journey.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(journeyId: string) {
    if (!confirm("Delete this journey and all its steps?")) return;
    try {
      const res = await fetch(
        `/api/domains/${domainId}/journeys/${journeyId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      setJourneys((prev) => prev.filter((j) => j.id !== journeyId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-zinc-500">Loading journeys...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-medium text-zinc-200">Your Journeys</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {journeys.length === 0
              ? "No journeys yet. Generate from your Data Layer events or create one from scratch."
              : `${journeys.length} journey${journeys.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!hasEvents || generating}
            title={
              !hasEvents
                ? "Add events in the Data Layer first"
                : "Generate a journey from Data Layer events"
            }
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-muted)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              "Generate from Data Layer"
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            disabled={creating}
            className="px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-zinc-300 text-sm hover:bg-zinc-800 transition-all"
          >
            + New Journey
          </button>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowCreateModal(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-2xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-200">Create New Journey</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:bg-zinc-800 text-zinc-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-zinc-400">Journey Name</span>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none"
                  placeholder="e.g. Onboarding Flow"
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-zinc-400">Audience</span>
                <input
                  type="text"
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none"
                  placeholder="e.g. New users who haven't completed KYC"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-zinc-400">Objective</span>
                <textarea
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none resize-none"
                  placeholder="e.g. Guide users through identity verification to increase completion rate"
                />
              </label>
            </div>
            <div className="px-5 py-4 border-t border-zinc-800 flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-2 rounded-md text-xs text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBlank}
                disabled={creating}
                className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating..." : "Create Journey"}
              </button>
            </div>
          </div>
        </div>
      )}

      {journeys.length === 0 ? (
        <EmptyState hasEvents={hasEvents} onGenerate={handleGenerate} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {journeys.map((journey) => (
            <JourneyCard
              key={journey.id}
              journey={journey}
              domainId={domainId}
              onDelete={() => handleDelete(journey.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JourneyCard({
  journey,
  domainId,
  onDelete,
}: {
  journey: JourneySummary;
  domainId: string;
  onDelete: () => void;
}) {
  const router = useRouter();
  const counts = getStepKindCounts(journey);
  const [showComments, setShowComments] = useState(false);

  return (
    <div
      className="group relative rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 hover:border-[var(--accent)]/40 hover:shadow-lg hover:shadow-[var(--accent)]/5 transition-all cursor-pointer"
      onClick={() =>
        router.push(`/domain/${domainId}/mapping/${journey.id}`)
      }
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-zinc-200 truncate">
            {journey.name}
          </h3>
          {journey.description && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
              {journey.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"
          title="Delete journey"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {(journey.audience || journey.objective) && (
        <div className="space-y-1 mb-3">
          {journey.audience && (
            <p className="text-[11px] text-zinc-500 flex items-start gap-1.5">
              <span className="text-zinc-600 shrink-0 font-medium">Audience:</span>
              <span className="line-clamp-1">{journey.audience}</span>
            </p>
          )}
          {journey.objective && (
            <p className="text-[11px] text-zinc-500 flex items-start gap-1.5">
              <span className="text-zinc-600 shrink-0 font-medium">Objective:</span>
              <span className="line-clamp-1">{journey.objective}</span>
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
        <span>{journey.steps.length} steps</span>
        <span>{timeAgo(journey.updatedAt)}</span>
      </div>

      <div className="flex items-center gap-3">
        {KIND_DOTS.map(({ kind, color, label }) =>
          counts[kind] > 0 ? (
            <span key={kind} className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {counts[kind]} {label}
            </span>
          ) : null
        )}
        {journey.steps.length === 0 && (
          <span className="text-xs text-zinc-600 italic">Empty journey</span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(!showComments);
          }}
          className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {showComments ? "Hide" : "Comments"}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 border-t border-zinc-800 pt-3" onClick={(e) => e.stopPropagation()}>
          <CommentsPanel domainId={domainId} entityType="JOURNEY" entityId={journey.id} />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden flex">
        {KIND_DOTS.map(({ kind, color }) => {
          const pct =
            journey.steps.length > 0
              ? (counts[kind] / journey.steps.length) * 100
              : 0;
          return pct > 0 ? (
            <div
              key={kind}
              className={`${color} opacity-60`}
              style={{ width: `${pct}%` }}
            />
          ) : null;
        })}
      </div>
    </div>
  );
}

function EmptyState({
  hasEvents,
  onGenerate,
}: {
  hasEvents: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-zinc-700/50 p-12 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-zinc-500"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M17.5 14v7M14 17.5h7" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-zinc-300 mb-2">
        No journeys yet
      </h3>
      <p className="text-sm text-zinc-500 max-w-md mb-6">
        {hasEvents
          ? "Your Data Layer has events ready to be mapped. Generate a journey to visualize the user flow."
          : "Start by adding screens and generating events in the Data Layer, then come back to map them as a journey."}
      </p>
      {hasEvents && (
        <button
          type="button"
          onClick={onGenerate}
          className="px-5 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-muted)] transition-all"
        >
          Generate from Data Layer
        </button>
      )}
    </div>
  );
}
