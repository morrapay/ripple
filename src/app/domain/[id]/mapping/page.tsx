import { notFound } from "next/navigation";
import { getDomainById } from "@/lib/services/domain";
import { getDomainProgress } from "@/lib/services/progress";
import { ProgressStepper } from "@/components/progress-stepper";
import { JourneyDashboard } from "@/components/journey/journey-dashboard";

export default async function MappingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const domain = await getDomainById(id);
  if (!domain) notFound();

  const progress = await getDomainProgress(id);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
        Journey Mapping
      </h1>
      <p className="text-zinc-400 text-sm mb-6">
        Visualize user flows as interactive journeys. Generate from Data Layer
        events or build from scratch.
      </p>

      <ProgressStepper
        domainId={id}
        currentStep="mapping"
        canProceedToMapping={progress.canProceedToMapping}
      />

      <div className="mb-4 flex items-center gap-6 text-xs text-zinc-500">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-amber-500/50" />
          Action (behavioral)
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-blue-500/50" />
          System trigger
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-violet-500/50" />
          Communication
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-zinc-500/50" />
          State
        </span>
      </div>

      <JourneyDashboard domainId={id} />
    </div>
  );
}
