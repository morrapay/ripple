import type { DomainProgress } from "@/lib/services/progress";

interface Props {
  domainId: string;
  progress: DomainProgress;
}

export function StatusBoard({ domainId, progress }: Props) {
  void domainId;
  const p = progress;

  const cards = [
    {
      title: "Data Layer",
      value: `${p.behavioralEventsTotal + p.applicationEventsTotal}`,
      subtitle: "total events",
      detail: `${p.behavioralEventsTotal} behavioral · ${p.applicationEventsTotal} application`,
      color: "border-amber-500/30",
    },
    {
      title: "Journeys",
      value: `${p.journeyStepsCount}`,
      subtitle: "steps mapped",
      detail: p.journeyStepsCount > 0 ? "Across all journeys" : "No journeys created yet",
      color: "border-blue-500/30",
    },
    {
      title: "Communications",
      value: `${p.communicationPointsCount}`,
      subtitle: "comm points",
      detail: `${p.communicationsReadyForBraze} ready for Braze`,
      color: "border-violet-500/30",
    },
    {
      title: "Screens",
      value: `${p.figmaFlowsTotal}`,
      subtitle: "uploaded",
      detail: `${p.figmaFlowsHappy} happy · ${p.figmaFlowsUnhappy} unhappy flows`,
      color: "border-emerald-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((card) => (
        <div key={card.title} className={`rounded-lg border bg-[var(--card)] p-5 ${card.color}`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{card.title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[var(--foreground)]">{card.value}</span>
            <span className="text-sm text-zinc-400">{card.subtitle}</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">{card.detail}</p>
        </div>
      ))}
    </div>
  );
}
