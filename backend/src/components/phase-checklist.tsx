import Link from "next/link";
import type { DomainProgress } from "@/lib/services/progress";

interface Props {
  domainId: string;
  progress: DomainProgress;
}

const phases = [
  { key: "data-layer", label: "Data Layer", check: (p: DomainProgress) => p.hasEvents },
  { key: "mapping", label: "Journeys", check: (p: DomainProgress) => p.journeyStepsCount > 0 },
  {
    key: "communications",
    label: "Communications",
    check: (p: DomainProgress) =>
      p.communicationPointsCount > 0 &&
      p.commStepsWithoutComms === 0 &&
      p.communicationsDraft === 0 &&
      p.communicationsTotal > 0,
  },
] as const;

export function PhaseChecklist({ domainId, progress }: Props) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {phases.map((phase, i) => {
        const done = phase.check(progress);
        return (
          <div key={phase.key} className="flex items-center gap-3">
            {i > 0 && <span className="text-zinc-600">→</span>}
            <Link
              href={`/domain/${domainId}/${phase.key}`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                done
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-zinc-800/50 border border-zinc-700 text-zinc-400 hover:text-zinc-300"
              }`}
            >
              {done ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-zinc-600" />
              )}
              {phase.label}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
