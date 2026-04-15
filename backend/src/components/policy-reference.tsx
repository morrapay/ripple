"use client";

import { useState } from "react";
import {
  POLICY_CHANNELS,
  ALERT_COMBINATIONS,
  USE_CASES,
  type PolicyChannel,
  type ChannelCategory,
} from "@/lib/policy-data";

const CATEGORY_LABELS: Record<ChannelCategory, string> = {
  "in-app": "In-App",
  external: "External",
};

const CATEGORY_COLORS: Record<ChannelCategory, string> = {
  "in-app": "bg-indigo-500/20 text-indigo-300",
  external: "bg-amber-500/20 text-amber-300",
};

const STATUS_COLORS: Record<string, string> = {
  production: "bg-emerald-500/20 text-emerald-400",
  planned: "bg-blue-500/20 text-blue-400",
  frozen: "bg-orange-500/15 text-orange-400",
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ChannelCard({ channel }: { channel: PolicyChannel }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-[var(--foreground)]">
                {channel.name}
              </h3>
              <span
                className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded ${CATEGORY_COLORS[channel.category]}`}
              >
                {CATEGORY_LABELS[channel.category]}
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded ${STATUS_COLORS[channel.status]}`}
              >
                {channel.status}
              </span>
              {channel.devices.length > 0 && (
                <span className="text-[10px] text-zinc-500">
                  {channel.devices.join(" / ")}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-0.5 line-clamp-1">
              {channel.description}
            </p>
          </div>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-[var(--card-border)] space-y-5">
          {/* Description */}
          <p className="text-sm text-zinc-400">{channel.description}</p>

          {/* Quick facts grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Fact label="Context" value={channel.context} />
            <Fact label="Intent" value={channel.intent} />
            <Fact label="Tech owner" value={channel.techOwner} />
            <Fact label="Ops owner" value={channel.opsOwner} />
          </div>

          {/* Messaging */}
          <Section title="Messaging rules">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Allowed</p>
                <TagList
                  items={channel.messaging.allowed}
                  color="bg-emerald-500/15 text-emerald-400"
                />
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Not allowed</p>
                {channel.messaging.notAllowed.length > 0 ? (
                  <TagList
                    items={channel.messaging.notAllowed}
                    color="bg-red-500/15 text-red-400"
                  />
                ) : (
                  <span className="text-xs text-zinc-600">No restrictions documented</span>
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Category: <span className="text-zinc-400">{channel.messaging.category}</span>
            </p>
          </Section>

          {/* Audience */}
          <Section title="Audience & approval">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-zinc-400">
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Who can define</p>
                <p>{channel.audience.whoCanDefine}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Who signs off</p>
                <p>{channel.audience.whoSignsOff}</p>
              </div>
            </div>
            {channel.audience.restrictions.length > 0 && (
              <ul className="mt-2 space-y-1">
                {channel.audience.restrictions.map((r, i) => (
                  <li key={i} className="text-xs text-zinc-500 flex gap-2">
                    <span className="text-zinc-600">•</span> {r}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* CTA */}
          <Section title="Call to action">
            <p className="text-sm text-zinc-400 mb-2">
              CTA {channel.cta.required ? "required" : "optional"}
            </p>
            {channel.cta.rules.length > 0 && (
              <ul className="space-y-1">
                {channel.cta.rules.map((r, i) => (
                  <li key={i} className="text-xs text-zinc-500 flex gap-2">
                    <span className="text-zinc-600">•</span> {r}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Timing */}
          <Section title="Timing & delivery">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Cool-off</p>
                <p className="text-zinc-400">{channel.timing.coolOff}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Reminders</p>
                <p className="text-zinc-400">{channel.timing.reminders}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Delivery</p>
                <p className="text-zinc-400">{channel.timing.delivery}</p>
              </div>
            </div>
          </Section>

          {/* Ecosystem */}
          {channel.ecosystem.length > 0 && (
            <Section title="Ecosystem rules">
              <ul className="space-y-1">
                {channel.ecosystem.map((r, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex gap-2">
                    <span className="text-amber-400/60">⚠</span> {r}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Design highlights */}
          {channel.designHighlights.length > 0 && (
            <Section title="Design & content guidelines">
              <ul className="space-y-1">
                {channel.designHighlights.map((d, i) => (
                  <li key={i} className="text-xs text-zinc-500 flex gap-2">
                    <span className="text-zinc-600">•</span> {d}
                  </li>
                ))}
              </ul>
              {channel.figmaLink && (
                <a
                  href={channel.figmaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-[var(--accent)] hover:underline"
                >
                  Open in Figma →
                </a>
              )}
            </Section>
          )}

          {/* Alert severities */}
          {channel.alertSeverities && (
            <Section title="Severity levels">
              <div className="space-y-3">
                {channel.alertSeverities.map((sev) => (
                  <div
                    key={sev.level}
                    className="rounded-md border border-zinc-800 bg-zinc-900/50 p-4"
                  >
                    <h5 className="font-medium text-sm text-zinc-300 mb-2">
                      {sev.level}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs text-zinc-500 mb-2">
                      <div>
                        <span className="text-zinc-400">Allowed:</span>{" "}
                        {sev.messagesAllowed}
                      </div>
                      <div>
                        <span className="text-zinc-400">CTA:</span> {sev.cta}
                      </div>
                      <div>
                        <span className="text-zinc-400">Dismissible:</span>{" "}
                        {sev.canDismiss ? "Yes (X)" : "No"}
                      </div>
                      <div>
                        <span className="text-zinc-400">Coexists with:</span>{" "}
                        {sev.canCoexistWith.length > 0
                          ? sev.canCoexistWith.join(", ")
                          : "Nothing"}
                      </div>
                    </div>
                    <ul className="space-y-0.5">
                      {sev.guidelines.map((g, i) => (
                        <li key={i} className="text-xs text-zinc-600 flex gap-2">
                          <span>•</span> {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-900/50 border border-zinc-800 px-3 py-2">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm text-zinc-300 mt-0.5">{value}</p>
    </div>
  );
}

function TagList({ items, color }: { items: string[]; color: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`px-2 py-0.5 text-[11px] rounded ${color}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function PolicyReference() {
  const [filter, setFilter] = useState<ChannelCategory | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = POLICY_CHANNELS.filter((ch) => {
    if (filter !== "all" && ch.category !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ch.name.toLowerCase().includes(q) ||
        ch.description.toLowerCase().includes(q) ||
        ch.intent.toLowerCase().includes(q) ||
        ch.messaging.allowed.some((m) => m.toLowerCase().includes(q)) ||
        ch.messaging.notAllowed.some((m) => m.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const inApp = filtered.filter((c) => c.category === "in-app");
  const external = filtered.filter((c) => c.category === "external");

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-5">
        <p className="text-sm text-zinc-400 mb-3">
          Complete policy reference for all Payoneer communication channels.
          Each channel documents messaging rules, audience, CTA requirements,
          timing, ecosystem constraints, and design guidelines.
        </p>
        <p className="text-xs text-zinc-500">
          Source: Communication Policy Book — Payoneer Platform Real Estates.
          A chatbot will use this data to recommend channels and rules for your communication needs.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search channels, rules, use cases…"
          className="px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-[var(--foreground)] text-sm placeholder:text-zinc-600 w-64"
        />
        <div className="flex gap-1.5">
          {(["all", "in-app", "external"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === cat
                  ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/50"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Overview table */}
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--card-border)]">
          <h2 className="text-sm font-medium text-[var(--foreground)]">
            Channel overview ({filtered.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="text-left py-2 px-4 font-medium">Channel</th>
                <th className="text-left py-2 px-4 font-medium">Category</th>
                <th className="text-left py-2 px-4 font-medium">Status</th>
                <th className="text-left py-2 px-4 font-medium">Devices</th>
                <th className="text-left py-2 px-4 font-medium">Braze</th>
                <th className="text-left py-2 px-4 font-medium">CTA</th>
                <th className="text-left py-2 px-4 font-medium">
                  Messaging type
                </th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              {(() => {
                const inAppRows = filtered.filter((c) => c.category === "in-app");
                const externalRows = filtered.filter((c) => c.category === "external");
                const groups: { label: string; rows: typeof filtered }[] = [];
                if (inAppRows.length > 0) groups.push({ label: "In-App", rows: inAppRows });
                if (externalRows.length > 0) groups.push({ label: "External", rows: externalRows });

                return groups.map((group, gi) => (
                  <>
                    {(groups.length > 1 || filter === "all") && (
                      <tr key={`header-${gi}`}>
                        <td
                          colSpan={7}
                          className={`px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500 bg-zinc-900/60 ${gi > 0 ? "border-t-2 border-zinc-700" : ""}`}
                        >
                          {group.label}
                        </td>
                      </tr>
                    )}
                    {group.rows.map((ch) => (
                      <tr
                        key={ch.id}
                        className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 ${ch.status === "frozen" ? "opacity-60" : ""}`}
                      >
                        <td className="py-2 px-4 font-medium text-zinc-300">
                          {ch.name}
                        </td>
                        <td className="py-2 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded ${CATEGORY_COLORS[ch.category]}`}
                          >
                            {CATEGORY_LABELS[ch.category]}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded ${STATUS_COLORS[ch.status]}`}
                          >
                            {ch.status}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-xs">
                          {ch.devices.join(", ") || "—"}
                        </td>
                        <td className="py-2 px-4 text-xs">
                          {ch.brazeAvailable ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span className="text-emerald-400">Yes</span>
                              {ch.brazeNote && (
                                <span className="text-zinc-500 ml-1">— {ch.brazeNote}</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-zinc-600">No</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-xs">
                          {ch.cta.required ? "Required" : "Optional"}
                        </td>
                        <td className="py-2 px-4 text-xs">
                          {ch.messaging.category}
                        </td>
                      </tr>
                    ))}
                  </>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert combinations */}
      {(filter === "all" || filter === "in-app") && !search.trim() && (
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-medium text-[var(--foreground)] mb-3">
            Alert combination rules
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="text-left py-2 pr-4 font-medium">
                    Alert type
                  </th>
                  <th className="text-left py-2 font-medium">
                    Can appear alongside
                  </th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                {ALERT_COMBINATIONS.map((row) => (
                  <tr key={row.alert} className="border-b border-zinc-800/50">
                    <td className="py-2 pr-4 font-medium text-zinc-300">
                      {row.alert}
                    </td>
                    <td className="py-2">{row.shownAlongside}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Use cases */}
      {!search.trim() && filter === "all" && (
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-medium text-[var(--foreground)] mb-3">
            Supported use cases
          </h2>
          <div className="flex flex-wrap gap-2">
            {USE_CASES.map((uc) => (
              <span
                key={uc}
                className="px-3 py-1 text-xs rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700"
              >
                {uc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Channel cards by category */}
      {inApp.length > 0 && (
        <ChannelGroup label="In-App Channels" channels={inApp} />
      )}
      {external.length > 0 && (
        <ChannelGroup label="External Channels" channels={external} />
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-zinc-500 text-sm">
          No channels match your search.
        </div>
      )}
    </div>
  );
}

function ChannelGroup({
  label,
  channels,
}: {
  label: string;
  channels: PolicyChannel[];
}) {
  return (
    <div>
      <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
        {label} ({channels.length})
      </h2>
      <div className="space-y-3">
        {channels.map((ch) => (
          <ChannelCard key={ch.id} channel={ch} />
        ))}
      </div>
    </div>
  );
}
