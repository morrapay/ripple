"use client";

import { useState, useEffect, useRef } from "react";
import type { StepKind } from "./journey-node";
import { AuditHistory } from "../audit-history";
import { CommentsPanel } from "../comments-panel";

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

export interface SelectedStepData {
  id: string;
  name: string;
  description: string | null;
  kind: StepKind;
  imageUrl: string | null;
  waitDuration: string | null;
  splitVariants: { name: string; percentage: number }[] | null;
  conditionConfig: Record<string, unknown> | null;
  behavioralEvents: { behavioralEvent: BehavioralEvent }[];
  applicationEvents: { applicationEvent: ApplicationEvent }[];
  communicationPoints: CommunicationPoint[];
}

interface StepDetailPanelProps {
  step: SelectedStepData;
  domainId: string;
  allBehavioralEvents: BehavioralEvent[];
  allApplicationEvents: ApplicationEvent[];
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onDelete: () => Promise<void>;
  onSplit: () => Promise<void>;
  onClose: () => void;
}

const KIND_OPTIONS: { value: StepKind; label: string; color: string }[] = [
  { value: "ACTION", label: "Action", color: "text-amber-400" },
  { value: "SYSTEM_TRIGGER", label: "System Trigger", color: "text-blue-400" },
  { value: "COMMUNICATION", label: "Communication", color: "text-violet-400" },
  { value: "STATE", label: "State", color: "text-zinc-400" },
  { value: "DECISION", label: "Decision", color: "text-emerald-400" },
  { value: "WAIT_DELAY", label: "Wait / Delay", color: "text-orange-400" },
  { value: "AB_SPLIT", label: "A/B Split", color: "text-teal-400" },
];

export function StepDetailPanel({
  step,
  domainId,
  allBehavioralEvents,
  allApplicationEvents,
  onSave,
  onDelete,
  onSplit,
  onClose,
}: StepDetailPanelProps) {
  const [name, setName] = useState(step.name);
  const [description, setDescription] = useState(step.description ?? "");
  const [kind, setKind] = useState<StepKind>(step.kind);
  const [imageUrl, setImageUrl] = useState(step.imageUrl ?? "");
  const [behavioralEventId, setBehavioralEventId] = useState(
    step.behavioralEvents[0]?.behavioralEvent.id ?? ""
  );
  const [applicationEventId, setApplicationEventId] = useState(
    step.applicationEvents[0]?.applicationEvent.id ?? ""
  );
  const [commName, setCommName] = useState(
    step.communicationPoints[0]?.name ?? ""
  );
  const [triggerEvent, setTriggerEvent] = useState(
    step.communicationPoints[0]?.triggerEvent ?? ""
  );
  const [waitDuration, setWaitDuration] = useState(step.waitDuration ?? "");
  const [splitVariants, setSplitVariants] = useState<{ name: string; percentage: number }[]>(
    step.splitVariants ?? [{ name: "A", percentage: 50 }, { name: "B", percentage: 50 }]
  );
  const [conditionAttr, setConditionAttr] = useState(
    (step.conditionConfig as Record<string, string> | null)?.attribute ?? ""
  );
  const [conditionOp, setConditionOp] = useState(
    (step.conditionConfig as Record<string, string> | null)?.operator ?? "equals"
  );
  const [conditionVal, setConditionVal] = useState(
    (step.conditionConfig as Record<string, string> | null)?.value ?? ""
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(step.name);
    setDescription(step.description ?? "");
    setKind(step.kind);
    setImageUrl(step.imageUrl ?? "");
    setBehavioralEventId(
      step.behavioralEvents[0]?.behavioralEvent.id ?? ""
    );
    setApplicationEventId(
      step.applicationEvents[0]?.applicationEvent.id ?? ""
    );
    setCommName(step.communicationPoints[0]?.name ?? "");
    setTriggerEvent(step.communicationPoints[0]?.triggerEvent ?? "");
    setWaitDuration(step.waitDuration ?? "");
    setSplitVariants(step.splitVariants ?? [{ name: "A", percentage: 50 }, { name: "B", percentage: 50 }]);
    const cc = step.conditionConfig as Record<string, string> | null;
    setConditionAttr(cc?.attribute ?? "");
    setConditionOp(cc?.operator ?? "equals");
    setConditionVal(cc?.value ?? "");
  }, [step.id]);

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim() || "Step",
        description: description.trim() || undefined,
        kind,
        imageUrl: imageUrl.trim() || undefined,
        behavioralEventId: kind === "ACTION" ? (behavioralEventId || null) : null,
        applicationEventId: kind === "SYSTEM_TRIGGER" ? (applicationEventId || null) : null,
      };
      if (kind === "COMMUNICATION") {
        payload.communicationPointName = commName.trim() || name.trim() || "Communication";
        payload.triggerEvent = triggerEvent.trim() || undefined;
      }
      if (kind === "DECISION") {
        payload.conditionConfig = { attribute: conditionAttr, operator: conditionOp, value: conditionVal };
      }
      if (kind === "WAIT_DELAY") {
        payload.waitDuration = waitDuration.trim() || undefined;
      }
      if (kind === "AB_SPLIT") {
        payload.splitVariants = splitVariants;
      }
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this step?")) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="w-80 bg-[var(--card)] border-l border-[var(--card-border)] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)]">
        <h3 className="text-sm font-medium text-zinc-200">Step Details</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <Field label="Type">
          <div className="grid grid-cols-2 gap-1.5">
            {KIND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setKind(opt.value)}
                className={`text-xs px-2.5 py-1.5 rounded-md border transition-all ${
                  kind === opt.value
                    ? `border-[var(--accent)] bg-[var(--accent)]/10 ${opt.color} font-medium`
                    : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none transition-colors"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe what happens at this step..."
            className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none transition-colors resize-none"
          />
        </Field>

        <Field label="Screenshot / Image">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/upload", {
                  method: "POST",
                  body: formData,
                });
                if (!res.ok) throw new Error("Upload failed");
                const data = await res.json();
                setImageUrl(data.url);
              } catch {
                alert("Failed to upload image");
              } finally {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }
            }}
          />
          {imageUrl ? (
            <div className="relative group">
              <div className="rounded-lg overflow-hidden border border-zinc-700 h-32">
                <img
                  src={imageUrl}
                  alt="Step screenshot"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "";
                    (e.target as HTMLImageElement).alt = "Failed to load";
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-md bg-zinc-800 text-xs text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="px-2.5 py-1.5 rounded-md bg-red-900/60 text-xs text-red-300 hover:bg-red-900 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex flex-col items-center gap-2 px-4 py-5 rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-900/50 transition-colors cursor-pointer"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-zinc-500 border-t-[var(--accent)] rounded-full animate-spin" />
                  <span className="text-xs text-zinc-500">Uploading...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="text-xs text-zinc-500">Upload image</span>
                </>
              )}
            </button>
          )}
        </Field>

        {kind === "ACTION" && (
          <>
            <Field label="Trigger Event">
              <select
                value={behavioralEventId}
                onChange={(e) => setBehavioralEventId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none transition-colors"
              >
                <option value="">-- None --</option>
                {allBehavioralEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.eventName}
                  </option>
                ))}
              </select>
            </Field>
            {behavioralEventId && (() => {
              const ev = allBehavioralEvents.find((e) => e.id === behavioralEventId);
              return ev ? (
                <div className="rounded-md border border-zinc-700/50 bg-zinc-900/40 px-3 py-2">
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-1">Event Details</p>
                  <p className="text-xs text-zinc-300 font-mono">{ev.eventName}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{ev.eventType}</p>
                  {ev.description && <p className="text-[10px] text-zinc-500 mt-0.5">{ev.description}</p>}
                </div>
              ) : null;
            })()}
          </>
        )}

        {kind === "SYSTEM_TRIGGER" && (
          <>
            <Field label="Trigger Event">
              <select
                value={applicationEventId}
                onChange={(e) => setApplicationEventId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none transition-colors"
              >
                <option value="">-- None --</option>
                {allApplicationEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.eventName}
                  </option>
                ))}
              </select>
            </Field>
            {applicationEventId && (() => {
              const ev = allApplicationEvents.find((e) => e.id === applicationEventId);
              return ev ? (
                <div className="rounded-md border border-zinc-700/50 bg-zinc-900/40 px-3 py-2">
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-1">Event Details</p>
                  <p className="text-xs text-zinc-300 font-mono">{ev.eventName}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{ev.eventType}</p>
                  {ev.description && <p className="text-[10px] text-zinc-500 mt-0.5">{ev.description}</p>}
                </div>
              ) : null;
            })()}
          </>
        )}

        {kind === "COMMUNICATION" && (
          <>
            <Field label="Communication Name">
              <input
                type="text"
                value={commName}
                onChange={(e) => setCommName(e.target.value)}
                placeholder="e.g. Welcome email"
                className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </Field>
            <Field label="Trigger Event">
              <input
                type="text"
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                placeholder="e.g. user_registered"
                className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </Field>
          </>
        )}

        {kind === "DECISION" && (
          <>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-2.5">
              <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                <strong>How branching works:</strong> Define the condition below. On the canvas, drag from the <span className="text-emerald-400 font-bold">YES</span> handle (right) to the next step when the condition is true, and from the <span className="text-red-400 font-bold">NO</span> handle (bottom) for the false path.
              </p>
            </div>
            <Field label="Condition Attribute">
              <input
                type="text"
                value={conditionAttr}
                onChange={(e) => setConditionAttr(e.target.value)}
                placeholder="e.g. user.kyc_status"
                className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </Field>
            <Field label="Operator">
              <select
                value={conditionOp}
                onChange={(e) => setConditionOp(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none transition-colors"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="is_set">Is Set</option>
                <option value="is_not_set">Is Not Set</option>
              </select>
            </Field>
            <Field label="Value">
              <input
                type="text"
                value={conditionVal}
                onChange={(e) => setConditionVal(e.target.value)}
                placeholder="e.g. approved"
                className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </Field>
          </>
        )}

        {kind === "WAIT_DELAY" && (
          <Field label="Wait Duration">
            <div className="flex gap-2">
              <input
                type="text"
                value={waitDuration}
                onChange={(e) => setWaitDuration(e.target.value)}
                placeholder="e.g. 24 hours, 3 days"
                className="flex-1 px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Examples: &quot;30 minutes&quot;, &quot;24 hours&quot;, &quot;7 days&quot;</p>
          </Field>
        )}

        {kind === "AB_SPLIT" && (
          <Field label="Variants">
            <div className="space-y-2">
              {splitVariants.map((v, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => {
                      const next = [...splitVariants];
                      next[i] = { ...next[i], name: e.target.value };
                      setSplitVariants(next);
                    }}
                    className="w-16 px-2 py-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none"
                    placeholder="Name"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={v.percentage}
                    onChange={(e) => {
                      const next = [...splitVariants];
                      next[i] = { ...next[i], percentage: Number(e.target.value) };
                      setSplitVariants(next);
                    }}
                    className="w-20 px-2 py-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none"
                  />
                  <span className="text-xs text-zinc-500">%</span>
                  {splitVariants.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setSplitVariants(splitVariants.filter((_, j) => j !== i))}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSplitVariants([...splitVariants, { name: String.fromCharCode(65 + splitVariants.length), percentage: 0 }])}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                + Add variant
              </button>
              {splitVariants.reduce((s, v) => s + v.percentage, 0) !== 100 && (
                <p className="text-[11px] text-amber-400">Percentages must sum to 100%</p>
              )}
            </div>
          </Field>
        )}
      </div>

      <div className="border-t border-[var(--card-border)] px-4 py-3 space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-3 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50 transition-all"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-2 rounded-md border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 disabled:opacity-50 transition-all"
          >
            {deleting ? "..." : "Delete"}
          </button>
        </div>
        <button
          type="button"
          onClick={onSplit}
          className="w-full px-3 py-2 rounded-md border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 hover:text-zinc-300 transition-all"
        >
          Split journey from here
        </button>
      </div>

      {/* Comments & Audit */}
      <div className="border-t border-[var(--card-border)] px-4 py-3 space-y-3">
        <AuditHistory domainId={domainId} entityType="STEP" entityId={step.id} />
        <CommentsPanel domainId={domainId} entityType="STEP" entityId={step.id} />
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
