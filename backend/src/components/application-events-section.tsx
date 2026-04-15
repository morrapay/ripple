"use client";

import { useState, useEffect, useRef } from "react";

interface ApplicationEvent {
  id: string;
  eventName: string;
  eventType: string;
  description: string | null;
  status: string;
  handshakeContext: Record<string, unknown> | null;
  businessRationale: Record<string, unknown> | null;
}

interface ApplicationEventsSectionProps {
  domainId: string;
}

export function ApplicationEventsSection({ domainId }: ApplicationEventsSectionProps) {
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [businessQuestions, setBusinessQuestions] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<ApplicationEvent>>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/domains/${domainId}/application-events`);
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      setError("Failed to load application events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [domainId]);

  const parseQuestions = (text: string): string[] => {
    return text
      .split(/\n|\r/)
      .map((q) => q.trim())
      .filter((q) => q.length > 0);
  };

  const handleGenerate = async () => {
    const questions = parseQuestions(businessQuestions);
    if (questions.length === 0) {
      setError("Add at least one business question (free text or upload a document)");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/application-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessQuestions: questions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate");
      const suggestions = data.suggestions ?? [];
      if (suggestions.length === 0) {
        setError("No application events generated");
        setGenerating(false);
        return;
      }
      const bulkRes = await fetch(`/api/domains/${domainId}/application-events`, {
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

  const handleRegenerate = async () => {
    if (parseQuestions(businessQuestions).length === 0) {
      setError("Add business questions to regenerate");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      for (const e of events) {
        const res = await fetch(
          `/api/domains/${domainId}/application-events/${e.id}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Failed to delete event");
      }
      await handleGenerate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate");
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setBusinessQuestions((prev) =>
        prev ? `${prev}\n\n${text}` : text
      );
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleStartEdit = (event: ApplicationEvent) => {
    setEditingEventId(event.id);
    setEditDraft({
      eventName: event.eventName,
      description: event.description,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEventId) return;
    try {
      const res = await fetch(
        `/api/domains/${domainId}/application-events/${editingEventId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventName: editDraft.eventName,
            description: editDraft.description ?? null,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update");
      setEditingEventId(null);
      setEditDraft({});
      fetchData();
    } catch {
      setError("Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(
        `/api/domains/${domainId}/application-events/${eventId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      fetchData();
    } catch {
      setError("Failed to delete event");
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
        <p className="font-medium text-zinc-300 mb-2">What behavioral events enable</p>
        <p className="mb-2">
          Behavioral events allow you to segment users and personalize communications based on:
        </p>
        <ul className="list-disc list-inside space-y-1 text-zinc-400">
          <li>Transaction volume (e.g. high vs low volume users)</li>
          <li>Card number or product type</li>
          <li>Flow completion (e.g. users who completed onboarding vs dropped off)</li>
          <li>Error patterns (e.g. users who saw validation errors)</li>
          <li>Feature usage (e.g. users who used specific features)</li>
        </ul>
        <p className="mt-2 text-xs text-zinc-500">
          Application events are business-level events that drive campaigns, Tinder triage, and AI assistant flows.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6">
        <h3 className="font-medium text-[var(--foreground)] mb-4">Business questions</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Add your business questions or upload a document. Each question will be converted into an application event.
        </p>

        <textarea
          value={businessQuestions}
          onChange={(e) => setBusinessQuestions(e.target.value)}
          placeholder={`e.g. What is the user's transaction volume tier?
Which card type does the user have?
Did the user complete onboarding?`}
          rows={5}
          className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] placeholder:text-zinc-500 resize-y"
        />

        <div className="flex gap-2 mt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-md border border-zinc-600 text-zinc-400 text-sm hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            Upload document (.txt, .md)
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-[var(--card-border)]">
          <button
            onClick={handleGenerate}
            disabled={generating || parseQuestions(businessQuestions).length === 0}
            className="px-4 py-2 rounded-md bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? "Generating…" : "Generate Application Events"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6">
        <h3 className="font-medium text-[var(--foreground)] mb-4">
          Application events ({events.length})
        </h3>
        {events.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No events yet. Add business questions above and click Generate Application Events.
          </p>
        ) : (
          <div className="space-y-4">
            {events.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={handleRegenerate}
                  disabled={
                    generating ||
                    parseQuestions(businessQuestions).length === 0
                  }
                  className="text-sm text-[var(--accent)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Regenerate from business questions
                </button>
              </div>
            )}
            <ul className="space-y-4">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="p-4 rounded-md bg-zinc-900 border border-zinc-800"
                >
                  {editingEventId === e.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editDraft.eventName ?? ""}
                        onChange={(ev) =>
                          setEditDraft((d) => ({ ...d, eventName: ev.target.value }))
                        }
                        placeholder="Event name"
                        className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-[var(--foreground)]"
                      />
                      <textarea
                        value={editDraft.description ?? ""}
                        onChange={(ev) =>
                          setEditDraft((d) => ({ ...d, description: ev.target.value }))
                        }
                        placeholder="Description"
                        rows={2}
                        className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-[var(--foreground)]"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingEventId(null);
                            setEditDraft({});
                          }}
                          className="px-3 py-1.5 rounded-md border border-zinc-600 text-zinc-400 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-sm text-[var(--foreground)]">
                          {e.eventName}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">{e.eventType}</p>
                        {e.description && (
                          <p className="text-sm text-zinc-400 mt-1">{e.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
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
                        <button
                          onClick={() => handleStartEdit(e)}
                          className="text-xs text-[var(--accent)] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(e.id)}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
