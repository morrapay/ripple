"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PredefinedDomain {
  name: string;
  tags: string[];
}

const PREDEFINED_DOMAINS: PredefinedDomain[] = [
  { name: "Batch payments", tags: ["Money-out", "Commercial Products"] },
  { name: "CLM", tags: ["Onboarding"] },
  { name: "Contracts", tags: ["Network"] },
  { name: "Enterprise Initiate Payment", tags: ["Money-out", "Commercial Products"] },
  { name: "Manage Currencies", tags: ["Commercial Products"] },
  { name: "Manager Account Payment Request", tags: ["Wallet", "Commercial Products"] },
  { name: "PON & MAP", tags: ["Money-out", "Commercial Products"] },
  { name: "Pricing & Fees", tags: [] },
  { name: "Receiving Accounts", tags: ["Wallet", "Commercial Products"] },
  { name: "Role Management", tags: [] },
  { name: "VAT Services", tags: [] },
  { name: "Withdraw to Bank", tags: ["Money-out", "Commercial Products"] },
];

const LS_KEY = "ripple_last_domain";

export function DomainSelector() {
  const router = useRouter();
  const [selectedName, setSelectedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setSelectedName(saved);
    else setSelectedName(PREDEFINED_DOMAINS[0].name);
  }, []);

  const selected = PREDEFINED_DOMAINS.find((d) => d.name === selectedName);

  const handleOpen = async () => {
    if (!selectedName) return;
    setLoading(true);
    setError(null);

    localStorage.setItem(LS_KEY, selectedName);

    try {
      const listRes = await fetch("/api/domains");
      const listData = await listRes.json();
      const domains = listData.domains ?? [];
      const existing = domains.find((d: { name: string }) => d.name === selectedName);

      if (existing) {
        router.push(`/domain/${existing.id}/dashboard`);
        return;
      }

      const createRes = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedName,
          tags: selected?.tags ?? [],
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error ?? "Failed to create domain");
      router.push(`/domain/${createData.domain.id}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6 space-y-4">
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Select domain</label>
        <select
          value={selectedName}
          onChange={(e) => {
            setSelectedName(e.target.value);
            localStorage.setItem(LS_KEY, e.target.value);
          }}
          className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          {PREDEFINED_DOMAINS.map((d) => (
            <option key={d.name} value={d.name}>{d.name}</option>
          ))}
        </select>

        {selected && selected.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selected.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-300">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleOpen}
        disabled={!selectedName || loading}
        className="px-4 py-2 rounded-md bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-muted)] disabled:opacity-50 transition-colors"
      >
        {loading ? "Opening…" : "Open dashboard"}
      </button>
    </div>
  );
}
