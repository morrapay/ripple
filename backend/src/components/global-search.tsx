"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";

type SearchResults = {
  communications: Array<{
    id: string;
    name: string;
    channel: string | null;
    type: "communication";
  }>;
  journeys: Array<{ id: string; name: string; type: "journey" }>;
  steps: Array<{
    id: string;
    name: string;
    kind: string;
    journeyId: string;
    type: "step";
  }>;
  behavioralEvents: Array<{
    id: string;
    eventName: string;
    type: "behavioral_event";
  }>;
  applicationEvents: Array<{
    id: string;
    eventName: string;
    type: "application_event";
  }>;
};

const emptyResults: SearchResults = {
  communications: [],
  journeys: [],
  steps: [],
  behavioralEvents: [],
  applicationEvents: [],
};

let searchOpen = false;
const openListeners = new Set<() => void>();

function subscribeOpen(cb: () => void) {
  openListeners.add(cb);
  return () => openListeners.delete(cb);
}

function getOpenSnapshot() {
  return searchOpen;
}

function setSearchOpen(next: boolean) {
  if (searchOpen === next) return;
  searchOpen = next;
  openListeners.forEach((l) => l());
}

export function useGlobalSearch() {
  const isOpen = useSyncExternalStore(
    subscribeOpen,
    getOpenSnapshot,
    getOpenSnapshot
  );
  return { isOpen, setIsOpen: setSearchOpen };
}

function IconMap({ className }: { className?: string }) {
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
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 15" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
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
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function IconZap({ className }: { className?: string }) {
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
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? ""}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export interface GlobalSearchProps {
  domainId: string;
}

export default function GlobalSearch({ domainId }: GlobalSearchProps) {
  const router = useRouter();
  const { isOpen, setIsOpen } = useGlobalSearch();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = query.trim();

  const fetchResults = useCallback(
    async (q: string, signal: AbortSignal) => {
      if (!q) {
        setResults(emptyResults);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ q, domainId });
        const res = await fetch(`/api/search?${params.toString()}`, {
          signal,
        });
        if (!res.ok) {
          setResults(emptyResults);
          return;
        }
        const data = (await res.json()) as { results: SearchResults };
        setResults(data.results ?? emptyResults);
      } catch (err) {
        if (signal.aborted) return;
        setResults(emptyResults);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [domainId]
  );

  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
      setLoading(false);
      return;
    }
    setQuery("");
    setResults(emptyResults);
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!trimmed) {
      abortRef.current?.abort();
      abortRef.current = null;
      setResults(emptyResults);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      void fetchResults(trimmed, ac.signal);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [trimmed, isOpen, fetchResults]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, setIsOpen]);

  const navigate = useCallback(
    (path: string) => {
      setIsOpen(false);
      router.push(path);
    },
    [router, setIsOpen]
  );

  const onOverlayMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.target === overlayRef.current) setIsOpen(false);
    },
    [setIsOpen]
  );

  const hasAnyResults = useMemo(() => {
    const r = results;
    return (
      r.journeys.length > 0 ||
      r.communications.length > 0 ||
      r.steps.length > 0 ||
      r.behavioralEvents.length > 0 ||
      r.applicationEvents.length > 0
    );
  }, [results]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      role="presentation"
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={onOverlayMouseDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/40 ring-1 ring-white/5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2.5">
          <span className="text-zinc-500">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search journeys, comms, steps, events…"
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <kbd className="hidden shrink-0 rounded border border-zinc-700 bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 sm:inline">
            esc
          </kbd>
        </div>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto px-2 py-2">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-zinc-400">
              <Spinner className="text-indigo-400" />
              <span className="text-sm">Searching…</span>
            </div>
          )}

          {!loading && !trimmed && (
            <p className="py-10 text-center text-sm text-zinc-500">
              Type to search…
            </p>
          )}

          {!loading && trimmed && !hasAnyResults && (
            <p className="py-10 text-center text-sm text-zinc-500">
              No results
            </p>
          )}

          {!loading && trimmed && hasAnyResults && (
            <div className="space-y-4 pb-1">
              {results.journeys.length > 0 && (
                <section>
                  <div className="mb-1.5 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    <IconMap className="text-indigo-400" />
                    Journeys
                  </div>
                  <ul className="space-y-0.5">
                    {results.journeys.map((j) => (
                      <li key={j.id}>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/domain/${domainId}/mapping/${j.id}`)
                          }
                          className="flex w-full items-center rounded-lg px-2 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-800/90 hover:text-white focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                          {j.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {results.communications.length > 0 && (
                <section>
                  <div className="mb-1.5 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    <IconMail className="text-indigo-400" />
                    Communications
                  </div>
                  <ul className="space-y-0.5">
                    {results.communications.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/domain/${domainId}/communications`)
                          }
                          className="flex w-full flex-col gap-0.5 rounded-lg px-2 py-2 text-left transition hover:bg-zinc-800/90 focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                          <span className="text-sm text-zinc-200">{c.name}</span>
                          {c.channel && (
                            <span className="text-xs text-zinc-500">
                              {c.channel}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {results.steps.length > 0 && (
                <section>
                  <div className="mb-1.5 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    <IconCircle className="text-indigo-400" />
                    Steps
                  </div>
                  <ul className="space-y-0.5">
                    {results.steps.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/domain/${domainId}/mapping/${s.journeyId}`
                            )
                          }
                          className="flex w-full flex-col gap-0.5 rounded-lg px-2 py-2 text-left transition hover:bg-zinc-800/90 focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                          <span className="text-sm text-zinc-200">{s.name}</span>
                          <span className="text-xs text-zinc-500">{s.kind}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {(results.behavioralEvents.length > 0 ||
                results.applicationEvents.length > 0) && (
                <section>
                  <div className="mb-1.5 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    <IconZap className="text-indigo-400" />
                    Events
                  </div>
                  <ul className="space-y-0.5">
                    {results.behavioralEvents.map((e) => (
                      <li key={`b-${e.id}`}>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/domain/${domainId}/data-layer`)
                          }
                          className="flex w-full flex-col gap-0.5 rounded-lg px-2 py-2 text-left transition hover:bg-zinc-800/90 focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                          <span className="text-sm text-zinc-200">
                            {e.eventName}
                          </span>
                          <span className="text-xs text-amber-500/90">
                            Behavioral
                          </span>
                        </button>
                      </li>
                    ))}
                    {results.applicationEvents.map((e) => (
                      <li key={`a-${e.id}`}>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/domain/${domainId}/data-layer`)
                          }
                          className="flex w-full flex-col gap-0.5 rounded-lg px-2 py-2 text-left transition hover:bg-zinc-800/90 focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                          <span className="text-sm text-zinc-200">
                            {e.eventName}
                          </span>
                          <span className="text-xs text-sky-500/90">
                            Application
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-800 px-3 py-2 text-[11px] text-zinc-500">
          <span className="text-zinc-600">⌘K</span> /{" "}
          <span className="text-zinc-600">Ctrl+K</span> to open · click a result
        </div>
      </div>
    </div>
  );
}
