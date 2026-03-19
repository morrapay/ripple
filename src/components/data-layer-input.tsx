"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { QuestionSuggestions } from "./question-suggestions";
import { SCREEN_EVENT_AGENT, BUSINESS_QUESTION_AGENT } from "@/lib/ai/event-generator";
import { parseEventMappingDocument, toBehavioralEventInputs } from "@/lib/event-mapping-parser";

/* ── Types ────────────────────────────────────────── */

type AddScreenMode = "figma" | "upload" | null;

interface Screen {
  id: string;
  name: string;
  figmaLink: string | null;
  fileUrl: string | null;
}

const CHANNEL_OPTIONS = [
  "Email",
  "SMS",
  "WhatsApp",
  "Notification bell",
  "In-product alert",
  "Action required (TBD)",
] as const;

interface CommIntent {
  id: string;
  what: string;
  when: string;
  channels: string[];
}

interface GenerationContext {
  screens: { name: string; figmaLink: string | null; fileUrl?: string | null }[];
  businessQuestions: string[];
  communicationIntents: { what: string; when: string; channels: string[] }[];
}

interface StandardProperty {
  name: string;
  value: string;
}

interface BehavioralEvent {
  id: string;
  eventName: string;
  eventType: string;
  description: string | null;
  status: string;
  userProperties: string[] | null;
  eventProperties: string[];
  triggerDescription?: string;
  businessCritical?: boolean;
  platform?: string;
  figmaLink?: string | null;
  comments?: string | null;
  standardProperties?: StandardProperty[];
}

interface ApplicationEvent {
  id: string;
  eventName: string;
  eventType: string;
  description: string | null;
  status: string;
  triggerDescription?: string;
  businessCritical?: boolean;
  platform?: string;
  comments?: string | null;
  handshakeContext?: Record<string, unknown>;
  businessRationale?: Record<string, unknown>;
}

/* ── Helpers ──────────────────────────────────────── */

let _idCounter = 0;
function tempId() {
  return `tmp_${Date.now()}_${++_idCounter}`;
}

/* ── Component ────────────────────────────────────── */

export function DataLayerInput({ domainId }: { domainId: string }) {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [businessQuestions, setBusinessQuestions] = useState("");
  const [commIntents, setCommIntents] = useState<CommIntent[]>([]);

  const [behavioralEvents, setBehavioralEvents] = useState<BehavioralEvent[]>([]);
  const [applicationEvents, setApplicationEvents] = useState<ApplicationEvent[]>([]);

  /* Editable context that shows what events were generated from */
  const [generationContext, setGenerationContext] = useState<GenerationContext | null>(null);
  const [savedContextJSON, setSavedContextJSON] = useState<string>("");
  const contextDirty = generationContext !== null && JSON.stringify(generationContext) !== savedContextJSON;

  /* Event names added in the most recent generation run */
  const [newEventNames, setNewEventNames] = useState<Set<string>>(new Set());

  /* Hover tooltip for event schema */
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [tooltipRect, setTooltipRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Enriched metadata from EventGenerator (keyed by eventName) */
  const [enrichedMeta, setEnrichedMeta] = useState<
    Record<string, {
      triggerDescription?: string;
      businessCritical?: boolean;
      platform?: string;
      figmaLink?: string | null;
      comments?: string | null;
      standardProperties?: StandardProperty[];
    }>
  >({});
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploadingMapping, setUploadingMapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const basedOnRef = useRef<HTMLDivElement>(null);
  const eventMappingInputRef = useRef<HTMLInputElement>(null);

  /* Add screen form state */
  const [addScreenMode, setAddScreenMode] = useState<AddScreenMode>(null);
  const [newScreenName, setNewScreenName] = useState("");
  const [newScreenLink, setNewScreenLink] = useState("");
  const [newScreenImageData, setNewScreenImageData] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [addingScreen, setAddingScreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  /* Focus drop zone when switching to upload mode so user can paste immediately */
  useEffect(() => {
    if (addScreenMode === "upload" && !newScreenImageData) {
      try {
        dropZoneRef.current?.focus({ preventScroll: true });
      } catch {
        /* ignore focus errors */
      }
    }
  }, [addScreenMode, newScreenImageData]);

  /* Question suggestions panel */
  const [showSuggestions, setShowSuggestions] = useState(false);

  /* Add communication intent form state */
  const [showAddComm, setShowAddComm] = useState(false);
  const [newCommWhat, setNewCommWhat] = useState("");
  const [newCommWhen, setNewCommWhen] = useState("");
  const [newCommChannels, setNewCommChannels] = useState<string[]>([]);

  /* ── Fetch existing data ────────────────────────── */

  useEffect(() => {
    if (!domainId) {
      setLoading(false);
      setError("Domain not found");
      return;
    }
    (async () => {
      try {
        const [flowsRes, beRes, aeRes] = await Promise.all([
          fetch(`/api/domains/${domainId}/flows`),
          fetch(`/api/domains/${domainId}/behavioral-events`),
          fetch(`/api/domains/${domainId}/application-events`),
        ]);
        const flowsData = await flowsRes.json();
        const beData = await beRes.json();
        const aeData = await aeRes.json();

        if (!flowsRes.ok) {
          setError(typeof flowsData?.error === "string" ? flowsData.error : "Failed to load flows");
          return;
        }
        if (!beRes.ok) {
          setError(typeof beData?.error === "string" ? beData.error : "Failed to load behavioral events");
          return;
        }
        if (!aeRes.ok) {
          setError(typeof aeData?.error === "string" ? aeData.error : "Failed to load application events");
          return;
        }

        const flows = (flowsData.flows ?? []) as {
          id: string;
          name: string;
          figmaLink: string | null;
          fileUrl: string | null;
        }[];
        setScreens(flows.map((f) => ({ id: f.id, name: f.name, figmaLink: f.figmaLink, fileUrl: f.fileUrl })));
        setBehavioralEvents(beData.events ?? []);
        setApplicationEvents(aeData.events ?? []);
      } catch (err) {
        console.error("DataLayer fetch error:", err);
        setError("Failed to load existing data");
      } finally {
        setLoading(false);
      }
    })();
  }, [domainId]);

  /* ── Screen CRUD ────────────────────────────────── */

  const resetAddScreenForm = () => {
    setAddScreenMode(null);
    setNewScreenName("");
    setNewScreenLink("");
    setNewScreenImageData(null);
    setIsDragging(false);
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please provide an image file (PNG, JPG, etc.)");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setNewScreenImageData(dataUrl);
    if (!newScreenName.trim()) {
      const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      setNewScreenName(baseName);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processImageFile(file);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processImageFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newScreenName]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) await processImageFile(file);
        return;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newScreenName]);

  const handleAddScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScreenName.trim() || addingScreen) return;

    const name = newScreenName.trim();
    const figmaLink = newScreenLink.trim() || null;
    const fileUrl = newScreenImageData || null;

    setAddingScreen(true);
    resetAddScreenForm();
    setError(null);
    try {
      const res = await fetch(`/api/domains/${domainId}/flows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, flowType: "HAPPY_FLOW", figmaLink, fileUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : "Failed to add screen";
        throw new Error(msg);
      }
      setScreens((prev) => [
        ...prev,
        { id: data.flow?.id ?? tempId(), name, figmaLink, fileUrl },
      ]);
      setSuccessMessage(`Screen "${name}" added.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add screen");
    } finally {
      setAddingScreen(false);
    }
  };

  const handleDeleteScreen = async (screenId: string) => {
    try {
      const res = await fetch(`/api/domains/${domainId}/flows/${screenId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setScreens((prev) => prev.filter((s) => s.id !== screenId));
    } catch {
      setError("Failed to remove screen");
    }
  };

  /* ── Communication intent local state ───────────── */

  const handleAddComm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommWhat.trim()) return;
    setCommIntents((prev) => [
      ...prev,
      {
        id: tempId(),
        what: newCommWhat.trim(),
        when: newCommWhen.trim(),
        channels: [...newCommChannels],
      },
    ]);
    setNewCommWhat("");
    setNewCommWhen("");
    setNewCommChannels([]);
    setShowAddComm(false);
  };

  const handleDeleteComm = (id: string) => {
    setCommIntents((prev) => prev.filter((c) => c.id !== id));
  };

  /* ── Generate events ────────────────────────────── */

  const handleGenerate = async () => {
    const hasInput =
      screens.length > 0 ||
      businessQuestions.trim().length > 0 ||
      commIntents.length > 0;
    if (!hasInput) {
      setError("Fill in at least one section above — Figma screens, business questions, or communication intent.");
      return;
    }
    setGenerating(true);
    setError(null);
    setSuccessMessage(null);
    const previousNames = new Set([
      ...behavioralEvents.map((e) => e.eventName),
      ...applicationEvents.map((e) => e.eventName),
    ]);
    try {
      const questions = businessQuestions
        .split(/\n|\r/)
        .map((q) => q.trim())
        .filter((q) => q.length > 0);

      const inputScreens = screens.map((s) => ({ name: s.name, figmaLink: s.figmaLink, fileUrl: s.fileUrl ?? null }));
      const inputComms = commIntents.map((c) => ({
        what: c.what,
        when: c.when,
        channels: [...c.channels],
      }));

      const res = await fetch("/api/ai/generate-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screens: inputScreens,
          businessQuestions: questions,
          communicationIntents: commIntents.map((c) => ({
            what: c.what,
            when: c.when,
            where: c.channels.join(", "),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate events");

      const behavioralSuggestions = data.behavioral ?? [];
      const applicationSuggestions = data.application ?? [];

      /* Capture enriched metadata from EventGenerator before saving */
      const meta: typeof enrichedMeta = {};
      for (const ev of behavioralSuggestions) {
        meta[ev.eventName] = {
          triggerDescription: ev.triggerDescription,
          businessCritical: ev.businessCritical,
          platform: ev.platform,
          figmaLink: ev.figmaLink,
          comments: ev.comments,
          standardProperties: ev.standardProperties,
        };
      }
      for (const ev of applicationSuggestions) {
        meta[ev.eventName] = {
          triggerDescription: ev.triggerDescription,
          businessCritical: ev.businessCritical,
          platform: ev.platform,
          comments: ev.comments,
        };
      }
      setEnrichedMeta((prev) => ({ ...prev, ...meta }));

      if (behavioralSuggestions.length > 0) {
        const bulkRes = await fetch(
          `/api/domains/${domainId}/behavioral-events`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bulk: true, events: behavioralSuggestions }),
          }
        );
        if (!bulkRes.ok) throw new Error("Failed to save behavioral events");
      }

      if (applicationSuggestions.length > 0) {
        const bulkRes = await fetch(
          `/api/domains/${domainId}/application-events`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bulk: true, events: applicationSuggestions }),
          }
        );
        if (!bulkRes.ok)
          throw new Error("Failed to save application events");
      }

      const [beRes, aeRes] = await Promise.all([
        fetch(`/api/domains/${domainId}/behavioral-events`),
        fetch(`/api/domains/${domainId}/application-events`),
      ]);
      const beData = await beRes.json();
      const aeData = await aeRes.json();
      const allBe = beData.events ?? [];
      const allAe = aeData.events ?? [];
      setBehavioralEvents(allBe);
      setApplicationEvents(allAe);

      /* Mark events whose names didn't exist before this run */
      const freshNames = new Set<string>();
      for (const e of allBe) if (!previousNames.has(e.eventName)) freshNames.add(e.eventName);
      for (const e of allAe) if (!previousNames.has(e.eventName)) freshNames.add(e.eventName);
      setNewEventNames(freshNames);

      /* Merge new inputs into cumulative context */
      setGenerationContext((prev) => {
        const prevScreens = prev?.screens ?? [];
        const prevQuestions = prev?.businessQuestions ?? [];
        const prevComms = prev?.communicationIntents ?? [];

        const existingScreenNames = new Set(prevScreens.map((s) => s.name));
        const existingQuestions = new Set(prevQuestions);
        const existingCommKeys = new Set(prevComms.map((c) => c.what));

        const merged: GenerationContext = {
          screens: [
            ...prevScreens,
            ...inputScreens.filter((s) => !existingScreenNames.has(s.name)),
          ],
          businessQuestions: [
            ...prevQuestions,
            ...questions.filter((q) => !existingQuestions.has(q)),
          ],
          communicationIntents: [
            ...prevComms,
            ...inputComms.filter((c) => !existingCommKeys.has(c.what)),
          ],
        };
        setSavedContextJSON(JSON.stringify(merged));
        return merged;
      });
      setScreens([]);
      setBusinessQuestions("");
      setCommIntents([]);
      resetAddScreenForm();
      setSuccessMessage(
        `Generated ${behavioralSuggestions.length + applicationSuggestions.length} events — ${behavioralSuggestions.length} behavioral, ${applicationSuggestions.length} application`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
      basedOnRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate events");
    } finally {
      setGenerating(false);
    }
  };

  const handleEventMappingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMapping(true);
    setError(null);
    try {
      const text = await file.text();
      const parsed = parseEventMappingDocument(text);
      if (parsed.errors.length > 0 && parsed.events.length === 0) {
        setError(parsed.errors.join(" "));
        return;
      }
      const inputs = toBehavioralEventInputs(parsed.events);
      if (inputs.length === 0) {
        setError("No valid events found in the document. Expected columns: Business Critical, Event Type, Trigger + Event Description, Event Name, Event Property Name, Figma Link, Comments.");
        return;
      }
      const eventsToSave = inputs.map((ev) => ({
        eventName: ev.eventName,
        eventType: ev.eventType,
        description: ev.description,
        eventProperties: ev.eventProperties,
      }));
      const res = await fetch(`/api/domains/${domainId}/behavioral-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true, events: eventsToSave }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to import events");
      }
      const [beRes, aeRes] = await Promise.all([
        fetch(`/api/domains/${domainId}/behavioral-events`),
        fetch(`/api/domains/${domainId}/application-events`),
      ]);
      const beData = await beRes.json();
      const aeData = await aeRes.json();
      setBehavioralEvents(beData.events ?? []);
      setApplicationEvents(aeData.events ?? []);
      setSuccessMessage(`Imported ${inputs.length} behavioral events from event mapping.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      basedOnRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import event mapping");
    } finally {
      setUploadingMapping(false);
      e.target.value = "";
    }
  };

  /* ── Regenerate from edited context ────────────── */

  const handleRegenerate = async () => {
    if (!generationContext) return;
    const ctx = generationContext;
    const hasInput =
      ctx.screens.length > 0 ||
      ctx.businessQuestions.length > 0 ||
      ctx.communicationIntents.length > 0;
    if (!hasInput) {
      setError("The context is empty — add at least one screen, question, or communication intent.");
      return;
    }
    setGenerating(true);
    setError(null);
    setSuccessMessage(null);
    const previousNames = new Set([
      ...behavioralEvents.map((e) => e.eventName),
      ...applicationEvents.map((e) => e.eventName),
    ]);
    try {
      const res = await fetch("/api/ai/generate-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screens: ctx.screens,
          businessQuestions: ctx.businessQuestions,
          communicationIntents: ctx.communicationIntents.map((c) => ({
            what: c.what,
            when: c.when,
            where: c.channels.join(", "),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to regenerate events");

      const behavioralSuggestions = data.behavioral ?? [];
      const applicationSuggestions = data.application ?? [];

      const meta: typeof enrichedMeta = {};
      for (const ev of behavioralSuggestions) {
        meta[ev.eventName] = {
          triggerDescription: ev.triggerDescription,
          businessCritical: ev.businessCritical,
          platform: ev.platform,
          figmaLink: ev.figmaLink,
          comments: ev.comments,
          standardProperties: ev.standardProperties,
        };
      }
      for (const ev of applicationSuggestions) {
        meta[ev.eventName] = {
          triggerDescription: ev.triggerDescription,
          businessCritical: ev.businessCritical,
          platform: ev.platform,
          comments: ev.comments,
        };
      }
      setEnrichedMeta(meta);

      if (behavioralSuggestions.length > 0) {
        await fetch(`/api/domains/${domainId}/behavioral-events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bulk: true, events: behavioralSuggestions }),
        });
      }
      if (applicationSuggestions.length > 0) {
        await fetch(`/api/domains/${domainId}/application-events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bulk: true, events: applicationSuggestions }),
        });
      }

      const [beRes, aeRes] = await Promise.all([
        fetch(`/api/domains/${domainId}/behavioral-events`),
        fetch(`/api/domains/${domainId}/application-events`),
      ]);
      const beData = await beRes.json();
      const aeData = await aeRes.json();
      const allBe = beData.events ?? [];
      const allAe = aeData.events ?? [];
      setBehavioralEvents(allBe);
      setApplicationEvents(allAe);

      const freshNames = new Set<string>();
      for (const e of allBe) if (!previousNames.has(e.eventName)) freshNames.add(e.eventName);
      for (const e of allAe) if (!previousNames.has(e.eventName)) freshNames.add(e.eventName);
      setNewEventNames(freshNames);

      setSavedContextJSON(JSON.stringify(ctx));
      setSuccessMessage(
        `Regenerated ${behavioralSuggestions.length + applicationSuggestions.length} events.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
      basedOnRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate events");
    } finally {
      setGenerating(false);
    }
  };

  /* ── Event management ───────────────────────────── */

  const handleDeleteBehavioral = async (eventId: string) => {
    try {
      const res = await fetch(
        `/api/domains/${domainId}/behavioral-events/${eventId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      setBehavioralEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch {
      setError("Failed to delete event");
    }
  };

  const handleDeleteApplication = async (eventId: string) => {
    try {
      const res = await fetch(
        `/api/domains/${domainId}/application-events/${eventId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      setApplicationEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch {
      setError("Failed to delete event");
    }
  };

  const showSchemaTooltip = (eventId: string, el: HTMLElement) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const tooltipH = 420;
      const fitsBelow = rect.bottom + tooltipH < window.innerHeight;
      const top = fitsBelow ? rect.bottom + 4 : Math.max(8, rect.top - tooltipH - 4);
      setTooltipRect({ top, left: rect.left + 40, width: rect.width - 60 });
      setHoveredEvent(eventId);
    }, 300);
  };

  const hideSchemaTooltip = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = null;
    setHoveredEvent(null);
    setTooltipRect(null);
  };

  /* ── Loading state ──────────────────────────────── */

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-8 animate-pulse">
        <div className="h-4 bg-zinc-700 rounded w-1/3 mb-4" />
        <div className="h-32 bg-zinc-700 rounded" />
      </div>
    );
  }

  const totalEvents = behavioralEvents.length + applicationEvents.length;
  const isBusy = generating || addingScreen;

  /* ── Render ─────────────────────────────────────── */

  return (
    <div className="space-y-8 relative">
      {/* Loading overlay */}
      {isBusy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-700 bg-zinc-900 px-8 py-6 shadow-xl">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <p className="text-sm font-medium text-[var(--foreground)]">
              {generating ? "Generating events…" : "Uploading screen…"}
            </p>
            <p className="text-xs text-zinc-500">
              {generating ? "This may take a moment." : "Please wait."}
            </p>
          </div>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 text-emerald-400 text-sm font-medium">
          ✓ {successMessage}
        </div>
      )}
      {/* ─── What we need from you ─────────────────── */}
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium text-[var(--foreground)] mb-1">
          What we need from you
        </h2>
        <p className="text-sm text-zinc-500 mb-8">
          Provide the inputs below and the system will generate both behavioral and application events automatically.
        </p>

        {/* ① Figma screens */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white text-xs font-bold">
              1
            </span>
            <div>
              <h3 className="font-medium text-[var(--foreground)]">Screens</h3>
              <p className="text-sm text-zinc-500 mt-0.5">
                Add the relevant screens — via Figma link, file upload, or paste.
                Include both web and mobile views where applicable. Focus on screens where user interaction or state changes happen.
              </p>
            </div>
          </div>

          {screens.length > 0 && (
            <ul className="space-y-2 mb-4 ml-9">
              {screens.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-zinc-900 border border-zinc-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {s.fileUrl && (
                      <img
                        src={s.fileUrl}
                        alt={s.name}
                        className="shrink-0 w-10 h-10 rounded object-cover border border-zinc-700"
                      />
                    )}
                    <span className="font-medium text-sm text-[var(--foreground)] truncate">
                      {s.name}
                    </span>
                    {s.figmaLink && (
                      <a
                        href={s.figmaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs text-[var(--accent)] hover:underline"
                      >
                        Open in Figma →
                      </a>
                    )}
                    {s.fileUrl && !s.figmaLink && (
                      <span className="shrink-0 text-xs text-zinc-500">Image uploaded</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteScreen(s.id)}
                    className="shrink-0 ml-2 text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="ml-9">
            {addScreenMode !== null ? (
              <div className="max-w-lg space-y-4">
                {/* Mode selector tabs */}
                <div className="flex gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
                  {([
                    { key: "figma" as const, label: "Figma link" },
                    { key: "upload" as const, label: "Upload image" },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setAddScreenMode(tab.key);
                        setNewScreenImageData(null);
                        setNewScreenLink("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        addScreenMode === tab.key
                          ? "bg-[var(--accent)] text-white"
                          : "text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAddScreen} className="space-y-3">
                  {/* Screen name (shared across all modes) */}
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Screen name</label>
                    <input
                      type="text"
                      value={newScreenName}
                      onChange={(e) => setNewScreenName(e.target.value)}
                      placeholder="e.g. Card Order Wizard - Step 1"
                      className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] text-sm placeholder:text-zinc-600"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Figma link mode */}
                  {addScreenMode === "figma" && (
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Figma link</label>
                      <input
                        type="url"
                        value={newScreenLink}
                        onChange={(e) => setNewScreenLink(e.target.value)}
                        placeholder="https://figma.com/..."
                        className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] text-sm placeholder:text-zinc-600"
                      />
                    </div>
                  )}

                  {/* Upload image mode — click, drag & drop, or paste */}
                  {addScreenMode === "upload" && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {newScreenImageData ? (
                        <div className="relative rounded-md border border-zinc-700 overflow-hidden">
                          <img
                            src={newScreenImageData}
                            alt="Preview"
                            className="w-full max-h-48 object-contain bg-zinc-950"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setNewScreenImageData(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-zinc-900/80 text-zinc-300 rounded hover:bg-zinc-800"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div
                          ref={dropZoneRef}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onPaste={handlePaste}
                          tabIndex={0}
                          className={`w-full py-8 rounded-md border-2 border-dashed text-center text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent)] ${
                            isDragging
                              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] cursor-copy"
                              : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 cursor-default"
                          }`}
                        >
                          <div className="space-y-2">
                            <p className="font-medium">
                              {isDragging ? "Drop image here" : "Click here, then paste (Ctrl/Cmd+V) — or drag & drop"}
                            </p>
                            <p className="text-xs text-zinc-500">
                              PNG, JPG, or other image formats
                            </p>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-md border border-zinc-600 text-zinc-300 text-xs hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                            >
                              Browse files
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={
                        addingScreen ||
                        !newScreenName.trim() ||
                        (addScreenMode === "upload" && !newScreenImageData)
                      }
                      className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingScreen ? "Adding…" : "Add"}
                    </button>
                    <button
                      type="button"
                      onClick={resetAddScreenForm}
                      className="px-3 py-1.5 rounded-md border border-zinc-600 text-zinc-400 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setAddScreenMode("figma")}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                + Add
              </button>
            )}
          </div>
        </div>

        {/* ② Business questions */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white text-xs font-bold">
              2
            </span>
            <div>
              <h3 className="font-medium text-[var(--foreground)]">Business questions</h3>
              <p className="text-sm text-zinc-500 mt-0.5">
                What do you need to measure or know about your users? What state changes matter?
                One question per line.
              </p>
            </div>
          </div>

          <div className="ml-9 max-w-lg">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-zinc-400">Your questions (one per line)</label>
              <button
                type="button"
                onClick={() => setShowSuggestions(true)}
                className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:brightness-125 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Suggest questions
              </button>
            </div>
            <textarea
              value={businessQuestions}
              onChange={(e) => setBusinessQuestions(e.target.value)}
              placeholder={`e.g.\nWhat happens when a user submits a card order?\nWhen is a card issued and what context is needed?\nHow do I know a user activated their card?\nWhat's the drop-off rate across the wizard steps?\nWhich step has the highest error rate?`}
              rows={6}
              className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] text-sm placeholder:text-zinc-600 resize-y"
            />
          </div>

          {showSuggestions &&
            createPortal(
              <QuestionSuggestions
                existingQuestions={businessQuestions}
                onApply={(merged) => setBusinessQuestions(merged)}
                onClose={() => setShowSuggestions(false)}
              />,
              document.body
            )}
        </div>

        {/* ③ Communication intent */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white text-xs font-bold">
              3
            </span>
            <div>
              <h3 className="font-medium text-[var(--foreground)]">Communication intent</h3>
              <p className="text-sm text-zinc-500 mt-0.5">
                What communication do you want to send, when should it trigger, and through which channel?
              </p>
            </div>
          </div>

          {commIntents.length > 0 && (
            <div className="ml-9 space-y-2 mb-4">
              {commIntents.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-4 py-3 px-4 rounded-md bg-zinc-900 border border-zinc-800"
                >
                  <div className="space-y-1.5 text-sm min-w-0">
                    <p className="text-[var(--foreground)] font-medium">{c.what}</p>
                    <p className="text-xs text-zinc-500">
                      <span className="text-zinc-400">When:</span> {c.when || "—"}
                    </p>
                    {c.channels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {c.channels.map((ch) => (
                          <span
                            key={ch}
                            className="px-2 py-0.5 text-[11px] rounded-full bg-[var(--accent)]/15 text-[var(--accent)]"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteComm(c.id)}
                    className="shrink-0 text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="ml-9">
            {showAddComm ? (
              <form onSubmit={handleAddComm} className="space-y-3 max-w-lg">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">What communication?</label>
                  <input
                    type="text"
                    value={newCommWhat}
                    onChange={(e) => setNewCommWhat(e.target.value)}
                    placeholder="e.g. Remind user to complete card order"
                    className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] text-sm placeholder:text-zinc-600"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">When should it trigger?</label>
                  <input
                    type="text"
                    value={newCommWhen}
                    onChange={(e) => setNewCommWhen(e.target.value)}
                    placeholder="e.g. 24 hours after card_order_started with no card_order_submitted"
                    className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] text-sm placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Which channel(s)?</label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNEL_OPTIONS.map((ch) => {
                      const selected = newCommChannels.includes(ch);
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() =>
                            setNewCommChannels((prev) =>
                              selected
                                ? prev.filter((c) => c !== ch)
                                : [...prev, ch]
                            )
                          }
                          className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                            selected
                              ? "bg-[var(--accent)]/20 border-[var(--accent)]/50 text-[var(--accent)]"
                              : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                          }`}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-sm font-medium"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddComm(false);
                      setNewCommWhat("");
                      setNewCommWhen("");
                      setNewCommChannels([]);
                    }}
                    className="px-3 py-1.5 rounded-md border border-zinc-600 text-zinc-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddComm(true)}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                + Add communication
              </button>
            )}
          </div>
        </div>

        {/* Generate button */}
        <div className="pt-6 border-t border-[var(--card-border)] space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? "Generating events…" : "Generate Events"}
            </button>
            <span className="text-zinc-500 text-sm">or</span>
            <input
              ref={eventMappingInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleEventMappingUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => eventMappingInputRef.current?.click()}
              disabled={uploadingMapping}
              className="px-4 py-2 rounded-md border border-[var(--card-border)] text-zinc-300 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploadingMapping ? "Importing…" : "Upload event mapping (CSV)"}
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Generate from screens/questions above, or upload a CSV with columns: Business Critical, Event Type, Trigger + Event Description, Event Name, Event Property Name, Figma Link, Comments.
          </p>
        </div>
      </div>

      {/* ─── Error ─────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ─── Generated events ──────────────────────── */}
      {totalEvents > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-[var(--foreground)]">
              Generated events ({totalEvents})
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Behavioral events from screens; application events from business questions.
            </p>
          </div>

          {/* ── Based on (editable context) ──────────────── */}
          {generationContext && (
            <div
              ref={basedOnRef}
              className={`rounded-lg border bg-[var(--card)] p-5 transition-colors ${contextDirty ? "border-[var(--accent)]/50" : "border-[var(--card-border)]"}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                  Based on
                </h3>
                {contextDirty && (
                  <button
                    onClick={handleRegenerate}
                    disabled={generating}
                    className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {generating ? "Regenerating…" : "Regenerate Events"}
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {/* Screens */}
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5 font-medium">Screens</p>
                  {generationContext.screens.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {generationContext.screens.map((s, i) => {
                        const viewUrl = s.figmaLink ?? s.fileUrl ?? null;
                        return (
                        <span key={i} className="group/chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-[var(--foreground)]">
                          {viewUrl ? (
                            <a
                              href={viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                              title={s.figmaLink ? "Open in Figma" : "View screen"}
                            >
                              {s.name}
                              <span className="text-[var(--accent)]" aria-hidden>↗</span>
                            </a>
                          ) : (
                            <span>{s.name}</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGenerationContext((prev) => prev && ({
                                ...prev,
                                screens: prev.screens.filter((_, idx) => idx !== i),
                              }));
                            }}
                            className="ml-0.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover/chip:opacity-100 transition-opacity"
                            aria-label={`Remove ${s.name}`}
                          >
                            ×
                          </button>
                        </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-600 italic">No screens</p>
                  )}
                  <button
                    onClick={() => {
                      const name = prompt("Screen name:");
                      if (!name?.trim()) return;
                      const link = prompt("Figma link (optional):");
                      setGenerationContext((prev) => prev && ({
                        ...prev,
                        screens: [...prev.screens, { name: name.trim(), figmaLink: link?.trim() || null }],
                      }));
                    }}
                    className="mt-2 text-[11px] text-[var(--accent)] hover:underline"
                  >
                    + Add screen
                  </button>
                </div>

                {/* Business questions */}
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5 font-medium">Business questions</p>
                  {generationContext.businessQuestions.length > 0 ? (
                    <ul className="space-y-1">
                      {generationContext.businessQuestions.map((q, i) => (
                        <li key={i} className="group/q flex items-start gap-2 text-xs text-zinc-300">
                          <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                          <span className="flex-1">{q}</span>
                          <button
                            onClick={() => setGenerationContext((prev) => prev && ({
                              ...prev,
                              businessQuestions: prev.businessQuestions.filter((_, idx) => idx !== i),
                            }))}
                            className="shrink-0 text-zinc-600 hover:text-red-400 opacity-0 group-hover/q:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-600 italic">No business questions</p>
                  )}
                  <button
                    onClick={() => {
                      const q = prompt("Business question:");
                      if (!q?.trim()) return;
                      setGenerationContext((prev) => prev && ({
                        ...prev,
                        businessQuestions: [...prev.businessQuestions, q.trim()],
                      }));
                    }}
                    className="mt-2 text-[11px] text-[var(--accent)] hover:underline"
                  >
                    + Add question
                  </button>
                </div>

                {/* Communication intents */}
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5 font-medium">Communication intents</p>
                  {generationContext.communicationIntents.length > 0 ? (
                    <div className="space-y-1.5">
                      {generationContext.communicationIntents.map((c, i) => (
                        <div key={i} className="group/comm flex items-start justify-between gap-2 text-xs text-zinc-300 py-1.5 px-3 rounded-md bg-zinc-900 border border-zinc-800">
                          <div>
                            <span className="font-medium text-[var(--foreground)]">{c.what}</span>
                            {c.when && <span className="text-zinc-500"> — when: {c.when}</span>}
                            {c.channels.length > 0 && (
                              <span className="text-zinc-500"> — via {c.channels.join(", ")}</span>
                            )}
                          </div>
                          <button
                            onClick={() => setGenerationContext((prev) => prev && ({
                              ...prev,
                              communicationIntents: prev.communicationIntents.filter((_, idx) => idx !== i),
                            }))}
                            className="shrink-0 text-zinc-600 hover:text-red-400 opacity-0 group-hover/comm:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-600 italic">No communication intents</p>
                  )}
                  <button
                    onClick={() => {
                      const what = prompt("What communication?");
                      if (!what?.trim()) return;
                      const when = prompt("When should it trigger?") ?? "";
                      const channels = prompt("Channels (comma separated, e.g. Email, SMS):") ?? "";
                      setGenerationContext((prev) => prev && ({
                        ...prev,
                        communicationIntents: [...prev.communicationIntents, {
                          what: what.trim(), when: when.trim(), channels: channels.split(",").map((ch) => ch.trim()).filter(Boolean),
                        }],
                      }));
                    }}
                    className="mt-2 text-[11px] text-[var(--accent)] hover:underline"
                  >
                    + Add communication
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Behavioral Events ──────────────────────── */}
          {behavioralEvents.length > 0 && (
            <div className="rounded-lg border border-emerald-500/30 bg-[var(--card)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-3">
                  <h3 className="flex items-center gap-3 text-sm font-medium text-emerald-400">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-xs uppercase tracking-wider font-semibold">
                      Behavioral
                    </span>
                    <span className="text-zinc-400 font-normal">
                      {behavioralEvents.length} event{behavioralEvents.length !== 1 ? "s" : ""} — front-end UI interactions for analytics
                    </span>
                  </h3>
                  <span className="text-xs text-zinc-500 px-2 py-1 rounded border border-zinc-700 bg-zinc-900">
                    Agent: {SCREEN_EVENT_AGENT}
                  </span>
                </div>
                <button
                  type="button"
                  disabled
                  title="Coming soon — generate a ticket for data/development"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-500 text-xs cursor-not-allowed hover:border-zinc-600 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 8h20" />
                    <path d="M9 4v4" />
                    <path d="M15 4v4" />
                  </svg>
                  Create Ticket
                </button>
              </div>
              <div className="divide-y divide-zinc-800/50">
                {behavioralEvents.map((e) => {
                  const meta = enrichedMeta[e.eventName];
                  const isExpanded = expandedEvents.has(e.id);
                  return (
                    <div
                      key={e.id}
                      className="group"
                      onMouseEnter={(ev) => !isExpanded && showSchemaTooltip(e.id, ev.currentTarget)}
                      onMouseLeave={hideSchemaTooltip}
                    >
                      <div className="flex items-start gap-4 py-3 px-5">
                        <button
                          onClick={() =>
                            setExpandedEvents((prev) => {
                              const next = new Set(prev);
                              if (next.has(e.id)) { next.delete(e.id); } else { next.add(e.id); hideSchemaTooltip(); }
                              return next;
                            })
                          }
                          className="shrink-0 mt-1 w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-transform"
                          style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                        >
                          ▸
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-mono text-sm text-[var(--foreground)]">
                              {e.eventName}
                            </p>
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-400 uppercase tracking-wide">
                              {e.eventType}
                            </span>
                            {meta?.businessCritical && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400 uppercase tracking-wide font-semibold">
                                Critical
                              </span>
                            )}
                            {meta?.platform && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-500">
                                {meta.platform}
                              </span>
                            )}
                          </div>
                          {(meta?.triggerDescription || e.description) && (
                            <p className="text-xs text-zinc-500 mt-1">
                              {meta?.triggerDescription || e.description}
                            </p>
                          )}
                          {meta?.comments && (
                            <p className="text-xs text-zinc-600 mt-0.5 italic">
                              {meta.comments}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                          {newEventNames.has(e.eventName) && (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wide font-semibold animate-pulse border border-emerald-500/30">
                              New
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteBehavioral(e.id)}
                            className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="pb-4 px-5 ml-9 space-y-3">
                          {meta?.standardProperties && meta.standardProperties.length > 0 && (
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5 font-medium">
                                Standard Properties
                              </p>
                              <div className="rounded-md border border-zinc-800 overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-zinc-900 text-zinc-400">
                                      <th className="text-left px-3 py-1.5 font-medium">Property</th>
                                      <th className="text-left px-3 py-1.5 font-medium">Value</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-800/50">
                                    {meta.standardProperties.map((p, i) => (
                                      <tr key={i} className="text-zinc-300">
                                        <td className="px-3 py-1.5 font-mono text-zinc-400">{p.name}</td>
                                        <td className="px-3 py-1.5">{p.value || <span className="text-zinc-600">—</span>}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          {e.eventProperties && Array.isArray(e.eventProperties) && (
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5 font-medium">
                                Event Properties
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {(e.eventProperties as string[]).map((p) => (
                                  <span key={p} className="px-2 py-0.5 text-[11px] rounded bg-zinc-800 text-zinc-400 font-mono">
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {meta?.figmaLink && (
                            <a
                              href={meta.figmaLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                            >
                              Open in Figma →
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Application Events ─────────────────────── */}
          {applicationEvents.length > 0 && (
            <div className="rounded-lg border border-blue-500/30 bg-[var(--card)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center gap-3">
                  <h3 className="flex items-center gap-3 text-sm font-medium text-blue-400">
                    <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-xs uppercase tracking-wider font-semibold">
                      Application
                    </span>
                    <span className="text-zinc-400 font-normal">
                      {applicationEvents.length} event{applicationEvents.length !== 1 ? "s" : ""} — backend triggers for Braze journeys
                    </span>
                  </h3>
                  <span className="text-xs text-zinc-500 px-2 py-1 rounded border border-zinc-700 bg-zinc-900">
                    Agent: {BUSINESS_QUESTION_AGENT}
                  </span>
                </div>
                <button
                  type="button"
                  disabled
                  title="Coming soon — generate a ticket for data/development"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-500 text-xs cursor-not-allowed hover:border-zinc-600 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 8h20" />
                    <path d="M9 4v4" />
                    <path d="M15 4v4" />
                  </svg>
                  Create Ticket
                </button>
              </div>
              <div className="divide-y divide-zinc-800/50">
                {applicationEvents.map((e) => {
                  const meta = enrichedMeta[e.eventName];
                  const isExpanded = expandedEvents.has(e.id);
                  return (
                    <div
                      key={e.id}
                      className="group"
                      onMouseEnter={(ev) => !isExpanded && showSchemaTooltip(e.id, ev.currentTarget)}
                      onMouseLeave={hideSchemaTooltip}
                    >
                      <div className="flex items-start gap-4 py-3 px-5">
                        <button
                          onClick={() =>
                            setExpandedEvents((prev) => {
                              const next = new Set(prev);
                              if (next.has(e.id)) { next.delete(e.id); } else { next.add(e.id); hideSchemaTooltip(); }
                              return next;
                            })
                          }
                          className="shrink-0 mt-1 w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-transform"
                          style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                        >
                          ▸
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-mono text-sm text-[var(--foreground)]">
                              {e.eventName}
                            </p>
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-400 uppercase tracking-wide">
                              {e.eventType}
                            </span>
                            {meta?.businessCritical && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400 uppercase tracking-wide font-semibold">
                                Critical
                              </span>
                            )}
                            {meta?.platform && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-500">
                                {meta.platform}
                              </span>
                            )}
                          </div>
                          {(meta?.triggerDescription || e.description) && (
                            <p className="text-xs text-zinc-500 mt-1">
                              {meta?.triggerDescription || e.description}
                            </p>
                          )}
                          {meta?.comments && (
                            <p className="text-xs text-zinc-600 mt-0.5 italic">
                              {meta.comments}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                          {newEventNames.has(e.eventName) && (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-400 uppercase tracking-wide font-semibold animate-pulse border border-blue-500/30">
                              New
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteApplication(e.id)}
                            className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="pb-4 px-5 ml-9 space-y-3">
                          {e.description && (
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1 font-medium">
                                Description
                              </p>
                              <p className="text-xs text-zinc-300">{e.description}</p>
                            </div>
                          )}
                          {meta && (
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5 font-medium">
                                Event Context
                              </p>
                              <div className="rounded-md border border-zinc-800 overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-zinc-900 text-zinc-400">
                                      <th className="text-left px-3 py-1.5 font-medium">Field</th>
                                      <th className="text-left px-3 py-1.5 font-medium">Value</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-800/50">
                                    <tr className="text-zinc-300">
                                      <td className="px-3 py-1.5 font-mono text-zinc-400">trigger</td>
                                      <td className="px-3 py-1.5">{meta.triggerDescription || "—"}</td>
                                    </tr>
                                    <tr className="text-zinc-300">
                                      <td className="px-3 py-1.5 font-mono text-zinc-400">business_critical</td>
                                      <td className="px-3 py-1.5">{meta.businessCritical ? "Yes" : "No"}</td>
                                    </tr>
                                    <tr className="text-zinc-300">
                                      <td className="px-3 py-1.5 font-mono text-zinc-400">platform</td>
                                      <td className="px-3 py-1.5">{meta.platform || "—"}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Schema tooltip portal ──────────────────────── */}
      {hoveredEvent && tooltipRect && (() => {
        const be = behavioralEvents.find((ev) => ev.id === hoveredEvent);
        const ae = applicationEvents.find((ev) => ev.id === hoveredEvent);
        const evt = be || ae;
        if (!evt) return null;
        const meta = enrichedMeta[evt.eventName];
        const isBehavioral = !!be;
        const accent = isBehavioral ? "text-emerald-400" : "text-blue-400";
        const accentName = isBehavioral ? "font-mono text-emerald-400" : "font-mono text-blue-400";
        return createPortal(
          <div
            className="fixed z-[9999] rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60 p-4 space-y-3 max-h-[420px] overflow-y-auto"
            style={{ top: tooltipRect.top, left: tooltipRect.left, width: Math.min(tooltipRect.width, 560) }}
            onMouseEnter={() => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); }}
            onMouseLeave={hideSchemaTooltip}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[11px] uppercase tracking-wider font-semibold ${accent}`}>Event Schema</p>
              <span className="text-[10px] text-zinc-500 font-mono">{evt.eventName}</span>
            </div>
            <div className="rounded-md border border-zinc-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-zinc-800/60 text-zinc-400">
                    <th className="text-left px-3 py-1.5 font-medium w-2/5">Property</th>
                    <th className="text-left px-3 py-1.5 font-medium">Value / Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  <tr className="text-zinc-300">
                    <td className="px-3 py-1.5 font-mono text-zinc-400">event_name</td>
                    <td className={`px-3 py-1.5 ${accentName}`}>{evt.eventName}</td>
                  </tr>
                  <tr className="text-zinc-300">
                    <td className="px-3 py-1.5 font-mono text-zinc-400">event_type</td>
                    <td className="px-3 py-1.5">{evt.eventType}</td>
                  </tr>
                  <tr className="text-zinc-300">
                    <td className="px-3 py-1.5 font-mono text-zinc-400">business_critical</td>
                    <td className="px-3 py-1.5">{meta?.businessCritical ? "Yes" : "No"}</td>
                  </tr>
                  <tr className="text-zinc-300">
                    <td className="px-3 py-1.5 font-mono text-zinc-400">platform</td>
                    <td className="px-3 py-1.5">{meta?.platform || "desktop + mobile"}</td>
                  </tr>
                  <tr className="text-zinc-300">
                    <td className="px-3 py-1.5 font-mono text-zinc-400">trigger</td>
                    <td className="px-3 py-1.5">{meta?.triggerDescription || evt.description || "—"}</td>
                  </tr>
                  {isBehavioral && meta?.standardProperties?.map((p, i) => (
                    <tr key={`sp-${i}`} className="text-zinc-300">
                      <td className="px-3 py-1.5 font-mono text-zinc-400">{p.name}</td>
                      <td className="px-3 py-1.5">{p.value || <span className="text-zinc-600 italic">dynamic</span>}</td>
                    </tr>
                  ))}
                  {!isBehavioral && ae?.handshakeContext && Object.entries(ae.handshakeContext).length > 0 && (
                    <>
                      <tr className="bg-zinc-800/30">
                        <td colSpan={2} className="px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Handshake Context</td>
                      </tr>
                      {Object.entries(ae.handshakeContext).map(([k, v]) => (
                        <tr key={`hc-${k}`} className="text-zinc-300">
                          <td className="px-3 py-1.5 font-mono text-zinc-400 pl-6">{k}</td>
                          <td className="px-3 py-1.5">{String(v)}</td>
                        </tr>
                      ))}
                    </>
                  )}
                  {!isBehavioral && ae?.businessRationale && Object.entries(ae.businessRationale).length > 0 && (
                    <>
                      <tr className="bg-zinc-800/30">
                        <td colSpan={2} className="px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Business Rationale</td>
                      </tr>
                      {Object.entries(ae.businessRationale).map(([k, v]) => (
                        <tr key={`br-${k}`} className="text-zinc-300">
                          <td className="px-3 py-1.5 font-mono text-zinc-400 pl-6">{k}</td>
                          <td className="px-3 py-1.5">{String(v)}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
            {isBehavioral && be?.eventProperties && Array.isArray(be.eventProperties) && be.eventProperties.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-medium">Event Properties</p>
                <div className="flex flex-wrap gap-1">
                  {(be.eventProperties as string[]).map((p) => (
                    <span key={p} className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-400 font-mono">{p}</span>
                  ))}
                </div>
              </div>
            )}
            {meta?.figmaLink && (
              <a href={meta.figmaLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline">
                Figma ↗
              </a>
            )}
          </div>,
          document.body,
        );
      })()}
    </div>
  );
}
