"use client";

import { useState, useEffect, useCallback } from "react";

interface QuestionItem {
  id: string;
  question: string;
  category: string | null;
  dimension: string | null;
}

interface Props {
  existingQuestions: string;
  onApply: (questions: string) => void;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Core Funnel Performance": "📊",
  "Drop-off & Friction": "🚧",
  "Behavioral Interaction": "🔍",
  "Segment Performance": "👥",
  "Quality / Risk / Compliance": "🛡️",
  "Lifecycle & Re-engagement": "🔄",
};

export function QuestionSuggestions({ existingQuestions, onApply, onClose }: Props) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const existingSet = new Set(
    existingQuestions
      .split(/\n|\r/)
      .map((q) => q.trim().toLowerCase())
      .filter(Boolean)
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/question-bank");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setQuestions(data.questions ?? []);
        const cats: string[] = data.categories ?? [];
        setCategories(cats);
        setExpandedCats(new Set(cats));
      } catch {
        setError("Failed to load suggested questions");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleQuestion = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleCategory = useCallback(
    (category: string) => {
      const catQuestions = questions.filter((q) => q.category === category);
      const allSelected = catQuestions.every((q) => selected.has(q.id));
      setSelected((prev) => {
        const next = new Set(prev);
        for (const q of catQuestions) {
          if (allSelected) next.delete(q.id);
          else next.add(q.id);
        }
        return next;
      });
    },
    [questions, selected]
  );

  const toggleCatExpand = useCallback((category: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const handleApply = () => {
    const selectedQuestions = questions
      .filter((q) => selected.has(q.id))
      .map((q) => q.question);

    const existingLines = existingQuestions
      .split(/\n|\r/)
      .map((q) => q.trim())
      .filter(Boolean);

    const newQuestions = selectedQuestions.filter(
      (q) => !existingSet.has(q.toLowerCase())
    );

    const merged = [...existingLines, ...newQuestions].join("\n");
    onApply(merged);
    onClose();
  };

  const grouped = categories.map((cat) => ({
    category: cat,
    items: questions.filter((q) => q.category === cat),
  }));

  const selectedCount = selected.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Suggested Business Questions
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Select questions to add to your analytics instrumentation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-12 text-zinc-500 text-sm">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading suggestions…
            </div>
          )}

          {error && (
            <div className="py-8 text-center text-red-400 text-sm">{error}</div>
          )}

          {!loading && !error && grouped.map(({ category, items }) => {
            const icon = CATEGORY_ICONS[category] ?? "📋";
            const isExpanded = expandedCats.has(category);
            const catSelectedCount = items.filter((q) => selected.has(q.id)).length;
            const allCatSelected = catSelectedCount === items.length && items.length > 0;

            return (
              <div key={category} className="rounded-lg border border-zinc-800 overflow-hidden">
                {/* Category header */}
                <button
                  type="button"
                  onClick={() => toggleCatExpand(category)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-left"
                >
                  <span className="text-base">{icon}</span>
                  <span className="flex-1 text-sm font-medium text-[var(--foreground)]">
                    {category}
                  </span>
                  {catSelectedCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">
                      {catSelectedCount}
                    </span>
                  )}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-4 py-2 space-y-0.5">
                    {/* Select all for category */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="flex items-center gap-2 w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] transition-colors ${
                          allCatSelected
                            ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                            : "border-zinc-600"
                        }`}
                      >
                        {allCatSelected && "✓"}
                      </span>
                      {allCatSelected ? "Deselect all" : "Select all"}
                    </button>

                    {items.map((q) => {
                      const isSelected = selected.has(q.id);
                      const alreadyExists = existingSet.has(q.question.toLowerCase());

                      return (
                        <label
                          key={q.id}
                          className={`flex items-start gap-3 py-2 px-2 rounded-md cursor-pointer transition-colors ${
                            alreadyExists
                              ? "opacity-40 cursor-not-allowed"
                              : isSelected
                              ? "bg-[var(--accent)]/10"
                              : "hover:bg-zinc-800/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={alreadyExists}
                            onChange={() => toggleQuestion(q.id)}
                            className="sr-only"
                          />
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] transition-colors ${
                              isSelected
                                ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                                : "border-zinc-600"
                            }`}
                          >
                            {isSelected && "✓"}
                          </span>
                          <span className="text-sm text-[var(--foreground)] leading-snug">
                            {q.question}
                            {alreadyExists && (
                              <span className="ml-2 text-xs text-zinc-500">(already added)</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
          <span className="text-xs text-zinc-500">
            {selectedCount} question{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-zinc-600 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={selectedCount === 0}
              className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add {selectedCount > 0 ? selectedCount : ""} question{selectedCount !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
