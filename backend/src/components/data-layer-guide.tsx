"use client";

import { useState } from "react";

export function DataLayerGuide() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📋</span>
          <div>
            <h3 className="font-medium text-[var(--foreground)]">
              Communication runs on events
            </h3>
            <p className="text-sm text-zinc-400">
              Why events matter, what types exist, and what PMs gain
            </p>
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-[var(--card-border)] space-y-8">
          {/* Why it matters */}
          <div className="text-sm text-zinc-400">
            <h4 className="font-medium text-zinc-300 mb-2">Why it matters</h4>
            <p className="mb-3">
              Orchestrated communication must react to{" "}
              <strong className="text-zinc-300">what just happened</strong>, for the right user, in the
              right channel, at the right time. An event-driven foundation
              enables timely, identity-aware, preference-aware guidance that
              improves completion rates, reduces noise and support tickets, and
              increases trust.
            </p>
            <p>
              All customer communication must move to the Aurora event framework.
              Application events are now required to trigger communication — this
              is the only supported way to orchestrate messages in Braze.
            </p>
          </div>

          {/* Quick glossary */}
          <div>
            <h4 className="font-medium text-zinc-300 mb-3 text-sm">Quick glossary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                { term: "CEP", def: "Customer Engagement Platform — runs journeys, segmentation, message delivery. Ours is Braze." },
                { term: "CDP", def: "Data Centralization Platform — centralizes, validates, and distributes events. We use Segment." },
                { term: "Behavioral events", def: "Frontend/UI events used for UX analysis (page views, clicks, errors)." },
                { term: "Application events", def: "Backend authoritative events used for triggers and measurement." },
                { term: "Attributes", def: "Current state values (tier, balance, country) for segmentation and personalization." },
              ].map((item) => (
                <div key={item.term} className="p-3 rounded-md bg-zinc-900/50 border border-zinc-800">
                  <span className="font-medium text-zinc-300">{item.term}:</span>{" "}
                  <span className="text-zinc-500">{item.def}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Core concepts */}
          <div>
            <h4 className="font-medium text-zinc-300 mb-3 text-sm">Core concepts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-md bg-zinc-900/50 border border-zinc-800">
                <h5 className="font-medium text-zinc-300 mb-2 text-xs uppercase tracking-wide">
                  Events — &ldquo;What happened, when, and why&rdquo;
                </h5>
                <p className="text-sm text-zinc-500 mb-2">
                  Immutable, timestamped facts. Application events = real
                  business outcomes (approved, activated, submitted). Behavioral events = UI interactions (views, clicks).
                </p>
                <p className="text-xs text-zinc-600">
                  Application events → triggers. Behavioral events → analytics.
                </p>
              </div>
              <div className="p-4 rounded-md bg-zinc-900/50 border border-zinc-800">
                <h5 className="font-medium text-zinc-300 mb-2 text-xs uppercase tracking-wide">
                  Attributes — &ldquo;Who the user is now&rdquo;
                </h5>
                <p className="text-sm text-zinc-500 mb-2">
                  Current state: role, tier, balance, country, preferences.
                  Overwrites history — not designed for &ldquo;when something happened.&rdquo;
                </p>
                <p className="text-xs text-zinc-600">
                  Best for segmentation, personalization, eligibility. Cannot trigger time-sensitive communication alone.
                </p>
              </div>
            </div>
          </div>

          {/* Event types table */}
          <div>
            <h4 className="font-medium text-zinc-300 mb-3 text-sm">Event types at a glance</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-2 pr-4 text-zinc-400 font-medium">Type</th>
                    <th className="text-left py-2 pr-4 text-zinc-400 font-medium">Source</th>
                    <th className="text-left py-2 pr-4 text-zinc-400 font-medium">Best for</th>
                    <th className="text-left py-2 text-zinc-400 font-medium">Limitations</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-400">
                  <tr className="border-b border-zinc-800">
                    <td className="py-3 pr-4">
                      <span className="font-medium text-emerald-400/90">Behavioral</span>
                    </td>
                    <td className="py-3 pr-4">Frontend (UI interactions)</td>
                    <td className="py-3 pr-4">Funnels, UX, attribution</td>
                    <td className="py-3">Can be blocked (ad blockers, consent). ~10% data loss. Not authoritative</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">
                      <span className="font-medium text-blue-400/90">Application</span>
                    </td>
                    <td className="py-3 pr-4">Backend (state changes)</td>
                    <td className="py-3 pr-4">Real-time triggers, SLAs, compliance, measurement</td>
                    <td className="py-3">Higher implementation effort. Requires schema governance</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card example */}
          <div>
            <h4 className="font-medium text-zinc-300 mb-3 text-sm">Example: Card order flow</h4>
            <div className="space-y-2 text-sm">
              {[
                { step: "User starts card order wizard", type: "Behavioral", event: "card_order_wizard_started", color: "emerald" },
                { step: "User submits card order", type: "Application", event: "card_order_submitted", color: "blue" },
                { step: "Card is issued", type: "Application", event: "card_issued", color: "blue" },
                { step: "User activates the card", type: "Application", event: "card_activated", color: "blue" },
                { step: "User views card number", type: "Behavioral", event: "card_number_viewed", color: "emerald" },
              ].map((item) => (
                <div key={item.event} className="flex items-center gap-3 px-3 py-2 rounded-md bg-zinc-900/50">
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded font-medium ${
                    item.color === "blue"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-zinc-400">{item.step}</span>
                  <code className="ml-auto text-xs text-zinc-600">{item.event}</code>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Braze journeys run on application events. Amplitude funnels rely on behavioral events. Segmentation is powered by attributes.
            </p>
          </div>

          {/* What PMs gain */}
          <div>
            <h4 className="font-medium text-zinc-300 mb-3 text-sm">What PMs gain</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-zinc-400">
              {[
                "Event-driven communication triggered by real user actions and state changes",
                "Real-time visibility & action — segmentation and journeys respond instantly",
                "Reliable, authoritative, contextual data signals",
                "Faster iteration with clearer contracts",
                "Governance: single backbone for orchestration, fatigue, and channel rules",
                "AI integration: structured data is the foundation for AI",
              ].map((item) => (
                <div key={item} className="flex gap-2 items-start">
                  <span className="text-emerald-400/60 mt-0.5">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-zinc-500 italic border-t border-zinc-800 pt-4">
            PMs define the logic and questions, not the technical wiring. The system generates the event specs.
          </div>
        </div>
      )}
    </div>
  );
}
