"use client";

import Link from "next/link";
import type { DomainProgress } from "@/lib/services/progress";

interface DashboardCountersProps {
  domainId: string;
  progress: DomainProgress;
}

export function DashboardCounters({ domainId, progress }: DashboardCountersProps) {
  const config = [
    {
      key: "figmaFlows",
      label: "Figma flows",
      sublabel: "Happy / Unhappy",
      value: `${progress.figmaFlowsHappy} / ${progress.figmaFlowsUnhappy}`,
      href: "data-layer",
    },
    {
      key: "behavioralEvents",
      label: "Behavioral events",
      sublabel: "Draft / Ready / Approved",
      value: `${progress.behavioralEventsDraft} / ${progress.behavioralEventsReady} / ${progress.behavioralEventsApproved}`,
      href: "data-layer",
    },
    {
      key: "applicationEvents",
      label: "Application events",
      sublabel: "Draft / Ready / Approved",
      value: `${progress.applicationEventsDraft} / ${progress.applicationEventsReady} / ${progress.applicationEventsApproved}`,
      href: "data-layer",
    },
    {
      key: "journeySteps",
      label: "Journey steps",
      sublabel: "Mapped",
      value: String(progress.journeyStepsCount),
      href: "mapping",
    },
    {
      key: "communicationPoints",
      label: "Communication points",
      sublabel: "Defined",
      value: String(progress.communicationPointsCount),
      href: "communications",
    },
    {
      key: "readyForBraze",
      label: "Ready for Braze",
      sublabel: "Communications",
      value: String(progress.communicationsReadyForBraze),
      href: "communications",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {config.map((item) => (
        <Link
          key={item.key}
          href={`/domain/${domainId}/${item.href}`}
          className="block rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4 hover:border-[var(--accent)]/50 transition-colors"
        >
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
            {item.sublabel}
          </p>
          <p className="text-2xl font-semibold text-[var(--foreground)]">
            {item.value}
          </p>
          <p className="text-sm text-zinc-400 mt-1">{item.label}</p>
        </Link>
      ))}
    </div>
  );
}
