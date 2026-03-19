"use client";

import { useState } from "react";

type StepKind = "ACTION" | "SYSTEM_TRIGGER" | "COMMUNICATION" | "STATE";

interface ExampleStep {
  label: string;
  event: string;
  kind: StepKind;
  detail?: string;
}

const EXAMPLE_STEPS: ExampleStep[] = [
  {
    label: "User starts card order wizard",
    event: "card_order_wizard_started",
    kind: "ACTION",
    detail: "Behavioral — tracked in Amplitude funnels",
  },
  {
    label: "User submits card order",
    event: "card_order_submitted",
    kind: "SYSTEM_TRIGGER",
    detail: "Application — backend state change triggers Braze journey",
  },
  {
    label: "Send order confirmation",
    event: "Email + In-product alert",
    kind: "COMMUNICATION",
    detail: "Triggered by card_order_submitted",
  },
  {
    label: "Card is issued",
    event: "card_issued",
    kind: "SYSTEM_TRIGGER",
    detail: "Application — issuer confirms card creation",
  },
  {
    label: "Send card issued notification",
    event: "Email + Push notification",
    kind: "COMMUNICATION",
    detail: "Triggered by card_issued",
  },
  {
    label: "User activates the card",
    event: "card_activated",
    kind: "SYSTEM_TRIGGER",
    detail: "Application — activation channel recorded",
  },
  {
    label: "Send activation confirmation",
    event: "Email",
    kind: "COMMUNICATION",
    detail: "Triggered by card_activated",
  },
  {
    label: "No activation after 48h",
    event: "Reminder: activate your card",
    kind: "COMMUNICATION",
    detail: "Triggered by card_issued + 48h delay without card_activated",
  },
];

const KIND_COLORS: Record<StepKind, { bg: string; border: string; text: string; dot: string }> = {
  ACTION: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-300", dot: "bg-amber-400" },
  SYSTEM_TRIGGER: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-300", dot: "bg-blue-400" },
  COMMUNICATION: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-300", dot: "bg-violet-400" },
  STATE: { bg: "bg-zinc-500/10", border: "border-zinc-500/30", text: "text-zinc-400", dot: "bg-zinc-400" },
};

const KIND_LABELS: Record<StepKind, string> = {
  ACTION: "Action",
  SYSTEM_TRIGGER: "System trigger",
  COMMUNICATION: "Communication",
  STATE: "State",
};

export function JourneyExample() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🗺️</span>
          <div>
            <h3 className="font-medium text-[var(--foreground)]">
              Example: Card order journey
            </h3>
            <p className="text-sm text-zinc-400">
              See how events, triggers, and communications connect into a journey
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
          className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-[var(--card-border)]">
          <p className="text-sm text-zinc-500 mb-5">
            This is the output you&apos;ll build — a linear sequence of user
            actions, system triggers, and the communications they fire.
          </p>

          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-[15px] top-3 bottom-3 w-px bg-zinc-700" />

            <div className="space-y-3">
              {EXAMPLE_STEPS.map((step, i) => {
                const colors = KIND_COLORS[step.kind];
                return (
                  <div key={i} className="flex items-start gap-4 relative">
                    {/* Dot on the line */}
                    <div className="relative z-10 mt-3 flex shrink-0 items-center justify-center w-[31px]">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                    </div>

                    {/* Card */}
                    <div
                      className={`flex-1 rounded-lg border px-4 py-3 ${colors.bg} ${colors.border}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] font-medium uppercase tracking-wide ${colors.text}`}>
                          {KIND_LABELS[step.kind]}
                        </span>
                        <span className="text-xs text-zinc-600">•</span>
                        <code className="text-xs text-zinc-500">{step.event}</code>
                      </div>
                      <p className="text-sm text-[var(--foreground)]">{step.label}</p>
                      {step.detail && (
                        <p className="text-xs text-zinc-500 mt-1">{step.detail}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800 text-xs text-zinc-500 space-y-1">
            <p>
              <strong className="text-zinc-400">Actions</strong> (behavioral events) feed analytics funnels in Amplitude.
            </p>
            <p>
              <strong className="text-zinc-400">System triggers</strong> (application events) are the backbone of Braze journeys — real-time, authoritative.
            </p>
            <p>
              <strong className="text-zinc-400">Communications</strong> are fired by triggers and delivered via the channels you defined.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
