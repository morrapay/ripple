"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type StepKind = "ACTION" | "SYSTEM_TRIGGER" | "COMMUNICATION" | "STATE";

interface BehavioralEvent {
  id: string;
  eventName: string;
  eventType: string;
  description: string | null;
}

interface ApplicationEvent {
  id: string;
  eventName: string;
  eventType: string;
  description: string | null;
}

interface CommunicationPoint {
  id: string;
  name: string;
  triggerEvent: string | null;
}

interface JourneyStep {
  id: string;
  order: number;
  name: string;
  description: string | null;
  behavioralEvents: { behavioralEvent: BehavioralEvent }[];
  applicationEvents: { applicationEvent: ApplicationEvent }[];
  communicationPoints: CommunicationPoint[];
}

interface JourneyBuilderProps {
  domainId: string;
}

const KIND_LABELS: Record<StepKind, string> = {
  ACTION: "Action",
  SYSTEM_TRIGGER: "System trigger",
  COMMUNICATION: "Communication",
  STATE: "State",
};

const KIND_COLORS: Record<StepKind, string> = {
  ACTION: "bg-amber-500/25 border-amber-500/60 text-amber-200",
  SYSTEM_TRIGGER: "bg-blue-500/25 border-blue-500/60 text-blue-200",
  COMMUNICATION: "bg-violet-500/25 border-violet-500/60 text-violet-200",
  STATE: "bg-zinc-500/25 border-zinc-500/60 text-zinc-300",
};

function getStepKind(step: JourneyStep): StepKind {
  if (step.behavioralEvents.length > 0) return "ACTION";
  if (step.applicationEvents.length > 0) return "SYSTEM_TRIGGER";
  if (step.communicationPoints.length > 0) return "COMMUNICATION";
  return "STATE";
}

function getStepDisplayName(step: JourneyStep): string {
  const kind = getStepKind(step);
  if (kind === "ACTION" && step.behavioralEvents[0]) {
    return step.behavioralEvents[0].behavioralEvent.eventName;
  }
  if (kind === "SYSTEM_TRIGGER" && step.applicationEvents[0]) {
    return step.applicationEvents[0].applicationEvent.eventName;
  }
  if (kind === "COMMUNICATION" && step.communicationPoints[0]) {
    return step.communicationPoints[0].name;
  }
  return step.name;
}

export function JourneyBuilder({ domainId }: JourneyBuilderProps) {
  const router = useRouter();
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [flows, setFlows] = useState<{ id: string; name: string }[]>([]);
  const [behavioralEvents, setBehavioralEvents] = useState<BehavioralEvent[]>([]);
  const [applicationEvents, setApplicationEvents] = useState<ApplicationEvent[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [mapping, setMapping] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stepsRes, flowsRes, behavioralRes, applicationRes] =
        await Promise.all([
          fetch(`/api/domains/${domainId}/journey-steps`),
          fetch(`/api/domains/${domainId}/flows`),
          fetch(`/api/domains/${domainId}/behavioral-events`),
          fetch(`/api/domains/${domainId}/application-events`),
        ]);

      if (!stepsRes.ok) throw new Error("Failed to fetch journey steps");
      if (!flowsRes.ok) throw new Error("Failed to fetch flows");
      if (!behavioralRes.ok) throw new Error("Failed to fetch behavioral events");
      if (!applicationRes.ok) throw new Error("Failed to fetch application events");

      const [stepsData, flowsData, behavioralData, applicationData] =
        await Promise.all([
          stepsRes.json(),
          flowsRes.json(),
          behavioralRes.json(),
          applicationRes.json(),
        ]);

      setSteps(stepsData.steps ?? []);
      setFlows((flowsData.flows ?? []).map((f: { id: string; name: string }) => ({ id: f.id, name: f.name })));
      setBehavioralEvents(behavioralData.events ?? []);
      setApplicationEvents(applicationData.events ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [domainId]);

  const handleAddStep = async (kind: StepKind, payload: Record<string, unknown>) => {
    try {
      setAdding(true);
      const res = await fetch(`/api/domains/${domainId}/journey-steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name: payload.name ?? "New step",
          description: payload.description,
          behavioralEventId: kind === "ACTION" ? payload.behavioralEventId : undefined,
          applicationEventId:
            kind === "SYSTEM_TRIGGER" ? payload.applicationEventId : undefined,
          communicationPointName:
            kind === "COMMUNICATION" ? payload.communicationPointName : undefined,
          triggerEvent: kind === "COMMUNICATION" ? payload.triggerEvent : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to add step");
      }
      const data = await res.json();
      setSteps(data.steps ?? []);
      setAdding(false);
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add step");
      setAdding(false);
    }
  };

  const handleUpdateStep = async (
    stepId: string,
    payload: Record<string, unknown>
  ) => {
    try {
      const res = await fetch(
        `/api/domains/${domainId}/journey-steps/${stepId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update step");
      }
      const data = await res.json();
      setSteps(data.steps ?? []);
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update step");
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    try {
      const res = await fetch(
        `/api/domains/${domainId}/journey-steps/${stepId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete step");
      }
      const data = await res.json();
      setSteps(data.steps ?? []);
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete step");
    }
  };

  const handleMapFlow = async () => {
    try {
      setMapping(true);
      setError(null);
      const res = await fetch(`/api/domains/${domainId}/flow-mapping`, {
        method: "POST",
      });
      let data: { error?: string; steps?: JourneyStep[] };
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid response from server");
      }
      if (!res.ok) throw new Error(data.error ?? "Failed to map flow");
      setSteps(data.steps ?? []);
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to map flow");
    } finally {
      setMapping(false);
    }
  };

  const hasFlows = flows.length > 0;
  const hasEvents = behavioralEvents.length > 0 || applicationEvents.length > 0;
  const flowMapDisabled = !hasEvents || mapping;

  const moveStep = async (stepId: string, direction: "up" | "down") => {
    const idx = steps.findIndex((s) => s.id === stepId);
    if (idx < 0) return;
    const newOrder = direction === "up" ? idx - 1 : idx + 1;
    if (newOrder < 0 || newOrder >= steps.length) return;
    await handleUpdateStep(stepId, { order: newOrder });
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-8 text-center text-zinc-500">
        Loading journey…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <p className="text-sm text-zinc-400">
          Add actions (user events), system triggers (application events), and
          communication points. Steps run in order.
        </p>
        <div className="flex flex-col items-end gap-1">
          {!hasEvents && (
            <p className="text-xs text-amber-400">
              Add behavioral or application events in the Data Layer first.
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMapFlow}
              disabled={flowMapDisabled}
              title={!hasEvents ? "Add events in the Data Layer first" : undefined}
              className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mapping ? "Mapping…" : "Generate flow map"}
            </button>
            {!adding && (
              <AddStepDropdown
                onAdd={handleAddStep}
                behavioralEvents={behavioralEvents}
                applicationEvents={applicationEvents}
              />
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
        {steps.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <p className="mb-4">No journey steps yet.</p>
            <p className="text-sm">
              Add an action, system trigger, or communication to start mapping
              your journey.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--card-border)]">
            {steps.map((step, index) => (
              <li key={step.id} className="flex items-stretch gap-4">
                <div className="flex flex-col items-center py-3 px-2 bg-zinc-900/50 min-w-[2rem]">
                  <span className="text-xs text-zinc-500 font-mono">
                    {index + 1}
                  </span>
                  {index > 0 && (
                    <div className="w-px flex-1 bg-zinc-600 mt-1" />
                  )}
                </div>
                <div className="flex-1 py-4 pr-4">
                  {editingId === step.id ? (
                    <StepEditor
                      step={step}
                      behavioralEvents={behavioralEvents}
                      applicationEvents={applicationEvents}
                      onSave={(payload) => handleUpdateStep(step.id, payload)}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => handleDeleteStep(step.id)}
                    />
                  ) : (
                    <StepCard
                      step={step}
                      onEdit={() => setEditingId(step.id)}
                      onDelete={() => handleDeleteStep(step.id)}
                      onMoveUp={
                        index > 0
                          ? () => moveStep(step.id, "up")
                          : undefined
                      }
                      onMoveDown={
                        index < steps.length - 1
                          ? () => moveStep(step.id, "down")
                          : undefined
                      }
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddStepDropdown({
  onAdd,
  behavioralEvents,
  applicationEvents,
}: {
  onAdd: (kind: StepKind, payload: Record<string, unknown>) => void;
  behavioralEvents: BehavioralEvent[];
  applicationEvents: ApplicationEvent[];
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<StepKind | null>(null);
  const [name, setName] = useState("");
  const [behavioralEventId, setBehavioralEventId] = useState("");
  const [applicationEventId, setApplicationEventId] = useState("");
  const [communicationPointName, setCommunicationPointName] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("");

  const handleSubmit = () => {
    if (mode === "ACTION" && behavioralEventId) {
      const ev = behavioralEvents.find((e) => e.id === behavioralEventId);
      onAdd("ACTION", {
        name: ev?.eventName ?? name,
        behavioralEventId,
      });
    } else if (mode === "SYSTEM_TRIGGER" && applicationEventId) {
      const ev = applicationEvents.find((e) => e.id === applicationEventId);
      onAdd("SYSTEM_TRIGGER", {
        name: ev?.eventName ?? name,
        applicationEventId,
      });
    } else if (mode === "COMMUNICATION" && communicationPointName.trim()) {
      onAdd("COMMUNICATION", {
        name: communicationPointName.trim(),
        communicationPointName: communicationPointName.trim(),
        triggerEvent: triggerEvent.trim() || undefined,
      });
    } else if (mode === "STATE" && name.trim()) {
      onAdd("STATE", { name: name.trim() });
    }
    setMode(null);
    setName("");
    setBehavioralEventId("");
    setApplicationEventId("");
    setCommunicationPointName("");
    setTriggerEvent("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="px-4 py-2 rounded-md border border-[var(--card-border)] bg-[var(--card)] text-zinc-300 hover:bg-zinc-800 transition-colors text-sm"
      >
        + Add step
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setOpen(false);
              setMode(null);
            }}
          />
          <div className="absolute right-0 top-full mt-1 z-20 w-80 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl p-4">
            {mode === null ? (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setMode("ACTION")}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-zinc-800 text-amber-200 text-sm"
                >
                  Action (behavioral event)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("SYSTEM_TRIGGER")}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-zinc-800 text-blue-200 text-sm"
                >
                  System trigger (application event)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("COMMUNICATION")}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-zinc-800 text-violet-200 text-sm"
                >
                  Communication
                </button>
                <button
                  type="button"
                  onClick={() => setMode("STATE")}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 text-sm"
                >
                  State (intermediate step)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {mode === "ACTION" && (
                  <>
                    <label className="block text-xs text-zinc-500">
                      Select behavioral event
                    </label>
                    <select
                      value={behavioralEventId}
                      onChange={(e) => setBehavioralEventId(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                    >
                      <option value="">— Select —</option>
                      {behavioralEvents.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.eventName}
                        </option>
                      ))}
                    </select>
                    {behavioralEvents.length === 0 && (
                      <p className="text-xs text-amber-400 mt-1">
                        Add behavioral events on the Data Layer first.
                      </p>
                    )}
                  </>
                )}
                {mode === "SYSTEM_TRIGGER" && (
                  <>
                    <label className="block text-xs text-zinc-500">
                      Select application event
                    </label>
                    <select
                      value={applicationEventId}
                      onChange={(e) => setApplicationEventId(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                    >
                      <option value="">— Select —</option>
                      {applicationEvents.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.eventName}
                        </option>
                      ))}
                    </select>
                    {applicationEvents.length === 0 && (
                      <p className="text-xs text-amber-400 mt-1">
                        Add application events on the Data Layer first.
                      </p>
                    )}
                  </>
                )}
                {mode === "COMMUNICATION" && (
                  <>
                    <label className="block text-xs text-zinc-500">
                      Communication name
                    </label>
                    <input
                      type="text"
                      value={communicationPointName}
                      onChange={(e) =>
                        setCommunicationPointName(e.target.value)
                      }
                      placeholder="e.g. Report was sent to the user"
                      className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                    />
                    <label className="block text-xs text-zinc-500">
                      Trigger event (optional)
                    </label>
                    <input
                      type="text"
                      value={triggerEvent}
                      onChange={(e) => setTriggerEvent(e.target.value)}
                      placeholder="e.g. report_ready"
                      className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                    />
                  </>
                )}
                {mode === "STATE" && (
                  <>
                    <label className="block text-xs text-zinc-500">
                      State name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Report requested"
                      className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
                    />
                  </>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-sm hover:opacity-90"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode(null)}
                    className="px-3 py-1.5 rounded-md border border-zinc-600 text-zinc-400 text-sm hover:bg-zinc-800"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StepCard({
  step,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  step: JourneyStep;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const kind = getStepKind(step);
  const displayName = getStepDisplayName(step);

  return (
    <div
      className={`rounded-lg border px-4 py-3 ${KIND_COLORS[kind]} flex items-center justify-between gap-4`}
    >
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium opacity-80">
          {KIND_LABELS[kind]}
        </span>
        <p className="font-medium truncate">{displayName}</p>
        {step.description && (
          <p className="text-xs opacity-80 mt-0.5 truncate">
            {step.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onMoveUp && (
          <button
            type="button"
            onClick={onMoveUp}
            className="p-1.5 rounded hover:bg-white/10"
            title="Move up"
          >
            ↑
          </button>
        )}
        {onMoveDown && (
          <button
            type="button"
            onClick={onMoveDown}
            className="p-1.5 rounded hover:bg-white/10"
            title="Move down"
          >
            ↓
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded hover:bg-white/10"
          title="Edit"
        >
          ✎
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-500/20 text-red-400"
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function StepEditor({
  step,
  behavioralEvents,
  applicationEvents,
  onSave,
  onCancel,
  onDelete,
}: {
  step: JourneyStep;
  behavioralEvents: BehavioralEvent[];
  applicationEvents: ApplicationEvent[];
  onSave: (payload: Record<string, unknown>) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const kind = getStepKind(step);
  const [name, setName] = useState(step.name);
  const [description, setDescription] = useState(step.description ?? "");
  const [behavioralEventId, setBehavioralEventId] = useState(
    step.behavioralEvents[0]?.behavioralEvent.id ?? ""
  );
  const [applicationEventId, setApplicationEventId] = useState(
    step.applicationEvents[0]?.applicationEvent.id ?? ""
  );
  const [communicationPointName, setCommunicationPointName] = useState(
    step.communicationPoints[0]?.name ?? ""
  );
  const [triggerEvent, setTriggerEvent] = useState(
    step.communicationPoints[0]?.triggerEvent ?? ""
  );
  const [editKind, setEditKind] = useState<StepKind>(kind);

  const handleSave = () => {
    const payload: Record<string, unknown> = {
      kind: editKind,
      name: name.trim() || "Step",
      description: description.trim() || undefined,
    };
    if (editKind === "ACTION") payload.behavioralEventId = behavioralEventId || null;
    if (editKind === "SYSTEM_TRIGGER")
      payload.applicationEventId = applicationEventId || null;
    if (editKind === "COMMUNICATION") {
      payload.communicationPointName = communicationPointName.trim();
      payload.triggerEvent = triggerEvent.trim() || undefined;
    }
    onSave(payload);
  };

  return (
    <div className="rounded-lg border border-zinc-600 bg-zinc-900/50 p-4 space-y-4">
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Type</label>
        <select
          value={editKind}
          onChange={(e) => setEditKind(e.target.value as StepKind)}
          className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
        >
          <option value="ACTION">Action</option>
          <option value="SYSTEM_TRIGGER">System trigger</option>
          <option value="COMMUNICATION">Communication</option>
          <option value="STATE">State</option>
        </select>
      </div>
      {editKind === "ACTION" && (
        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            Behavioral event
          </label>
          <select
            value={behavioralEventId}
            onChange={(e) => setBehavioralEventId(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
          >
            <option value="">— None —</option>
            {behavioralEvents.map((e) => (
              <option key={e.id} value={e.id}>
                {e.eventName}
              </option>
            ))}
          </select>
        </div>
      )}
      {editKind === "SYSTEM_TRIGGER" && (
        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            Application event
          </label>
          <select
            value={applicationEventId}
            onChange={(e) => setApplicationEventId(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
          >
            <option value="">— None —</option>
            {applicationEvents.map((e) => (
              <option key={e.id} value={e.id}>
                {e.eventName}
              </option>
            ))}
          </select>
        </div>
      )}
      {editKind === "COMMUNICATION" && (
        <>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Name</label>
            <input
              type="text"
              value={communicationPointName}
              onChange={(e) => setCommunicationPointName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              Trigger event
            </label>
            <input
              type="text"
              value={triggerEvent}
              onChange={(e) => setTriggerEvent(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
            />
          </div>
        </>
      )}
      {(editKind === "STATE" || editKind === "ACTION" || editKind === "SYSTEM_TRIGGER") && (
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
          />
        </div>
      )}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
          className="w-full px-3 py-2 rounded-md border border-zinc-600 bg-zinc-900 text-zinc-200 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-sm"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-md border border-zinc-600 text-zinc-400 text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="px-3 py-1.5 rounded-md border border-red-500/50 text-red-400 text-sm ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
