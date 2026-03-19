"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

interface Flow {
  id: string;
  name: string;
  flowType: string;
  figmaLink: string | null;
}

interface BehavioralEvent {
  id: string;
  eventName: string;
  eventType: string;
  description: string | null;
  status: string;
  userProperties: string[] | null;
  eventProperties: string[];
}

interface BehavioralEventsSectionProps {
  domainId: string;
  eventsManuallyConfirmed?: boolean;
}

const VALID_BEHAVIORAL_EVENT_TYPES = [
  "page_view",
  "click",
  "submit",
  "field_change",
  "error_message_view",
  "error_message",
  "error",
  "tooltip_view",
  "tooltip",
  "popup_view",
  "popup",
  "experiment_trigger",
  "toast",
] as const;

/** Parse CSV into array of row objects; supports Event Name, event_name, eventName, etc. */
function parseCSVToEvents(text: string): Array<{ eventName: string; eventType: string; description?: string; eventProperties: string[] }> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0];
  const rows = lines.slice(1);
  const sep = header.includes("\t") ? "\t" : header.includes(";") ? ";" : ",";
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === sep && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += c;
      }
    }
    result.push(current.trim());
    return result;
  };
  const headers = parseRow(header).map((h) => h.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
  const eventNameCol = headers.findIndex((h) => ["event_name", "eventname", "event"].includes(h) || h.includes("event") && h.includes("name"));
  const eventTypeCol = headers.findIndex((h) => ["event_type", "eventtype", "type"].includes(h) || h.includes("event") && h.includes("type"));
  const descCol = headers.findIndex((h) => ["description", "desc"].includes(h));
  const propsCol = headers.findIndex((h) => ["event_properties", "properties", "props"].includes(h));
  const fallbackEventNameCol = headers.findIndex((h) => h.includes("name") || h === "event");
  const fallbackEventTypeCol = headers.findIndex((h) => h.includes("type") || h === "type");
  const nameCol = eventNameCol >= 0 ? eventNameCol : fallbackEventNameCol >= 0 ? fallbackEventNameCol : 0;
  const typeCol = eventTypeCol >= 0 ? eventTypeCol : fallbackEventTypeCol >= 0 ? fallbackEventTypeCol : 1;
  const MANDATORY_PROPS = ["client_event_time", "system_name", "page_url"];
  const events: Array<{ eventName: string; eventType: string; description?: string; eventProperties: string[] }> = [];
  for (const row of rows) {
    const cells = parseRow(row);
    const eventName = (cells[nameCol] ?? "").trim();
    const eventType = (cells[typeCol] ?? "click").toLowerCase().replace(/\s+/g, "_");
    if (!eventName) continue;
    const validType = VALID_BEHAVIORAL_EVENT_TYPES.includes(eventType as (typeof VALID_BEHAVIORAL_EVENT_TYPES)[number])
      ? eventType
      : "click";
    const description = descCol >= 0 && cells[descCol] ? cells[descCol].trim() : undefined;
    let eventProperties = MANDATORY_PROPS;
    if (propsCol >= 0 && cells[propsCol]) {
      const props = cells[propsCol].split(/[,;|]/).map((p) => p.trim()).filter(Boolean);
      if (props.length > 0) eventProperties = [...new Set([...MANDATORY_PROPS, ...props])];
    }
    events.push({ eventName, eventType: validType, description, eventProperties });
  }
  return events;
}

export function BehavioralEventsSection({
  domainId,
  eventsManuallyConfirmed: initialEventsManuallyConfirmed = false,
}: BehavioralEventsSectionProps) {
  const router = useRouter();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [events, setEvents] = useState<BehavioralEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploadingEvents, setUploadingEvents] = useState(false);
  const [showAddFlow, setShowAddFlow] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowType, setNewFlowType] = useState<"HAPPY_FLOW" | "UNHAPPY_FLOW">("HAPPY_FLOW");
  const [newFigmaLink, setNewFigmaLink] = useState("");
  const [eventsManuallyConfirmed, setEventsManuallyConfirmed] = useState(
    initialEventsManuallyConfirmed
  );
  const [error, setError] = useState<string | null>(null);
  const eventFileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [flowsRes, eventsRes] = await Promise.all([
        fetch(`/api/domains/${domainId}/flows`),
        fetch(`/api/domains/${domainId}/behavioral-events`),
      ]);
      const flowsData = await flowsRes.json();
      const eventsData = await eventsRes.json();
      setFlows(flowsData.flows ?? []);
      setEvents(eventsData.events ?? []);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [domainId]);

  useEffect(() => {
    setEventsManuallyConfirmed(initialEventsManuallyConfirmed);
  }, [initialEventsManuallyConfirmed]);

  const handleEventsManuallyConfirmedChange = async (
    checked: boolean
  ) => {
    setError(null);
    try {
      const res = await fetch(`/api/domains/${domainId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventsManuallyConfirmed: checked }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEventsManuallyConfirmed(checked);
      router.refresh();
    } catch {
      setError("Failed to update");
    }
  };

  const handleEventFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEvents(true);
    setError(null);
    try {
      const text = await file.text();
      const isCSV = /\.csv$/i.test(file.name);
      let eventsToCreate: Array<{ eventName: string; eventType: string; description?: string; userProperties?: string[]; eventProperties: string[] }>;

      if (isCSV) {
        eventsToCreate = parseCSVToEvents(text);
      } else {
        const parsed = JSON.parse(text) as unknown;
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        eventsToCreate = arr
          .map((item: unknown) => {
            if (typeof item !== "object" || item === null) return null;
            const o = item as Record<string, unknown>;
            const eventType = String(o.eventType ?? "").toLowerCase();
            if (!VALID_BEHAVIORAL_EVENT_TYPES.includes(eventType as (typeof VALID_BEHAVIORAL_EVENT_TYPES)[number])) return null;
            return {
              eventName: String(o.eventName ?? ""),
              eventType,
              description: o.description ? String(o.description) : undefined,
              userProperties: Array.isArray(o.userProperties)
                ? (o.userProperties as string[])
                : undefined,
              eventProperties: Array.isArray(o.eventProperties)
                ? (o.eventProperties as string[])
                : [String(o.eventProperties ?? "client_event_time")],
            };
          })
          .filter(
            (ev): ev is NonNullable<typeof ev> =>
              ev !== null && ev.eventName.length > 0 && ev.eventProperties.length > 0
          );
      }

      if (eventsToCreate.length === 0) {
        setError("No valid events found. Use JSON (eventName, eventType, eventProperties) or CSV with Event Name, Event Type columns.");
        return;
      }
      const res = await fetch(`/api/domains/${domainId}/behavioral-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true, events: eventsToCreate }),
      });
      if (!res.ok) throw new Error("Failed to import events");
      fetchData();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse or import events"
      );
    } finally {
      setUploadingEvents(false);
      e.target.value = "";
    }
  };

  const handleAddFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName.trim()) return;
    setError(null);
    try {
      const res = await fetch(`/api/domains/${domainId}/flows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFlowName.trim(),
          flowType: newFlowType,
          figmaLink: newFigmaLink.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add flow");
      setNewFlowName("");
      setNewFigmaLink("");
      setShowAddFlow(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add flow");
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    try {
      const res = await fetch(`/api/domains/${domainId}/flows/${flowId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      fetchData();
    } catch {
      setError("Failed to delete flow");
    }
  };

  const handleGenerate = async () => {
    if (flows.length === 0) {
      setError("Add at least one flow first");
      return;
    }
    const happyCount = flows.filter((f) => f.flowType === "HAPPY_FLOW").length;
    const unhappyCount = flows.filter((f) => f.flowType === "UNHAPPY_FLOW").length;
    if (happyCount === 0 || unhappyCount === 0) {
      setError("Add at least one HAPPY_FLOW and one UNHAPPY_FLOW");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/behavioral-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowNames: flows.map((f) => f.name),
          flowTypes: flows.map((f) => f.flowType),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate");
      const suggestions = data.suggestions ?? [];
      if (suggestions.length === 0) {
        setError("No suggestions generated");
        setGenerating(false);
        return;
      }
      const bulkRes = await fetch(`/api/domains/${domainId}/behavioral-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true, events: suggestions }),
      });
      if (!bulkRes.ok) throw new Error("Failed to save events");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate events");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (eventId: string, status: string) => {
    try {
      const res = await fetch(
        `/api/domains/${domainId}/behavioral-events/${eventId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error("Failed to update");
      fetchData();
    } catch {
      setError("Failed to update status");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(
        `/api/domains/${domainId}/behavioral-events/${eventId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      fetchData();
    } catch {
      setError("Failed to delete event");
    }
  };

  const handleCopyEvent = async (e: BehavioralEvent) => {
    const text = [
      `Event: ${e.eventName}`,
      `Type: ${e.eventType}`,
      e.description ? `Description: ${e.description}` : null,
      `Event properties: ${(e.eventProperties as string[]).join(", ")}`,
      e.userProperties?.length
        ? `User properties: ${(e.userProperties as string[]).join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Failed to copy");
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-8 animate-pulse">
        <div className="h-4 bg-zinc-700 rounded w-1/3 mb-4" />
        <div className="h-20 bg-zinc-700 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/30 p-4 text-sm text-zinc-400">
        <p className="font-medium text-zinc-300 mb-2">Behavioral Telemetry</p>
        <p>
          Captures what a user does in the product: page views, clicks, form interactions, UI errors.
          Derived from happy &amp; unhappy flows. Follows standardized taxonomy and naming rules:
          <code className="mx-1 px-1 py-0.5 rounded bg-zinc-800">area_name_event_type</code>
          (lowercase, underscores).
        </p>
      </div>

      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6">
        <h3 className="font-medium text-[var(--foreground)] mb-4">Flow assets</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Upload Figma exports (PNG/PDF) or add Figma links. Tag as HAPPY_FLOW or UNHAPPY_FLOW.
        </p>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={eventsManuallyConfirmed}
            onChange={(e) =>
              handleEventsManuallyConfirmedChange(e.target.checked)
            }
            className="rounded border-zinc-600 bg-zinc-900 text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <span className="text-sm text-zinc-400">
            I&apos;ve already created events elsewhere (or will upload below)
          </span>
        </label>

        {eventsManuallyConfirmed && (
          <div className="flex gap-2 mb-4">
            <input
              ref={eventFileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleEventFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => eventFileInputRef.current?.click()}
              disabled={uploadingEvents}
              className="px-3 py-2 rounded-md border border-zinc-600 text-zinc-400 text-sm hover:bg-zinc-800 hover:text-zinc-200 transition-colors disabled:opacity-50"
            >
              {uploadingEvents ? "Uploading…" : "Upload events (JSON or CSV)"}
            </button>
            <span className="text-xs text-zinc-500 self-center">
              JSON or CSV with Event Name, Event Type columns
            </span>
          </div>
        )}

        {flows.length > 0 && (
          <ul className="space-y-2 mb-4">
            {flows.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-zinc-900"
              >
                <div>
                  <span className="font-mono text-sm">{f.name}</span>
                  <span
                    className={`ml-2 text-xs px-2 py-0.5 rounded ${
                      f.flowType === "HAPPY_FLOW"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {f.flowType}
                  </span>
                  {f.figmaLink && (
                    <a
                      href={f.figmaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-xs text-[var(--accent)] hover:underline"
                    >
                      Figma →
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteFlow(f.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {showAddFlow ? (
          <form onSubmit={handleAddFlow} className="space-y-3">
            <input
              type="text"
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
              placeholder="Flow name"
              className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)]"
              required
            />
            <select
              value={newFlowType}
              onChange={(e) => setNewFlowType(e.target.value as "HAPPY_FLOW" | "UNHAPPY_FLOW")}
              className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)]"
            >
              <option value="HAPPY_FLOW">HAPPY_FLOW</option>
              <option value="UNHAPPY_FLOW">UNHAPPY_FLOW</option>
            </select>
            <input
              type="url"
              value={newFigmaLink}
              onChange={(e) => setNewFigmaLink(e.target.value)}
              placeholder="Figma link (optional)"
              className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-sm"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddFlow(false)}
                className="px-3 py-1.5 rounded-md border border-zinc-600 text-zinc-400 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddFlow(true)}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            + Add flow
          </button>
        )}

        <div className="mt-6 pt-6 border-t border-[var(--card-border)]">
          <button
            onClick={handleGenerate}
            disabled={generating || flows.length < 2}
            className="px-4 py-2 rounded-md bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? "Generating…" : "Generate Behavioral Events"}
          </button>
          <p className="mt-2 text-xs text-zinc-500">
            Requires at least one HAPPY_FLOW and one UNHAPPY_FLOW.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6">
        <h3 className="font-medium text-[var(--foreground)] mb-4">
          Behavioral events ({events.length})
        </h3>
        {events.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No events yet. Add flows and click Generate Behavioral Events.
          </p>
        ) : (
          <ul className="space-y-4">
            {events.map((e) => (
              <li
                key={e.id}
                className="p-4 rounded-md bg-zinc-900 border border-zinc-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm text-[var(--foreground)]">
                      {e.eventName}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{e.eventType}</p>
                    {e.description && (
                      <p className="text-sm text-zinc-400 mt-1">{e.description}</p>
                    )}
                    <p className="text-xs text-zinc-500 mt-2">
                      Event props: {(e.eventProperties as string[]).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyEvent(e)}
                      className="p-1.5 rounded text-zinc-400 hover:text-[var(--foreground)] hover:bg-zinc-700/50 transition-colors"
                      title="Copy event"
                    >
                      <CopyIcon />
                    </button>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        e.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : e.status === "READY"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-zinc-600 text-zinc-400"
                      }`}
                    >
                      {e.status}
                    </span>
                    {e.status !== "APPROVED" && (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateStatus(e.id, e.status === "DRAFT" ? "READY" : "APPROVED")
                          }
                          className="text-xs text-[var(--accent)] hover:underline"
                        >
                          {e.status === "DRAFT" ? "Mark Ready" : "Approve"}
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(e.id)}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
