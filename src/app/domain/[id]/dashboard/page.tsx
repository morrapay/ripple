import { notFound } from "next/navigation";
import { getDomainById } from "@/lib/services/domain";
import { getDomainProgress } from "@/lib/services/progress";
import { ProgressStepper } from "@/components/progress-stepper";
import { DashboardCounters } from "@/components/dashboard-counters";
import { PrerequisiteAlert } from "@/components/prerequisite-alert";

export default async function DomainDashboardPage({
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
        {domain.name}
      </h1>
      <p className="text-zinc-400 text-sm mb-6">
        {domain.description ?? "No description"}
      </p>

      <ProgressStepper
        domainId={id}
        currentStep="dashboard"
        canProceedToMapping={progress.canProceedToMapping}
      />

      <PrerequisiteAlert
        canProceedToMapping={progress.canProceedToMapping}
        figmaFlowsHappy={progress.figmaFlowsHappy}
        figmaFlowsUnhappy={progress.figmaFlowsUnhappy}
        hasEvents={
          progress.behavioralEventsTotal > 0 || progress.applicationEventsTotal > 0
        }
      />

      <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">
        Progress
      </h2>
      <DashboardCounters domainId={id} progress={progress} />
    </div>
  );
}
