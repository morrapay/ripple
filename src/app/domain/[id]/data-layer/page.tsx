import { notFound } from "next/navigation";
import { getDomainById } from "@/lib/services/domain";
import { getDomainProgress } from "@/lib/services/progress";
import { ProgressStepper } from "@/components/progress-stepper";
import { DataLayerGuide } from "@/components/data-layer-guide";
import { DataLayerInput } from "@/components/data-layer-input";
import { ApprovalBar } from "@/components/approval-bar";

export default async function DataLayerPage({
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
        Data Layer
      </h1>
      <p className="text-zinc-400 text-sm mb-6">
        Define events for {domain.name} — the system generates behavioral and application events from your inputs.
      </p>

      <ApprovalBar domainId={id} hasEvents={progress.hasEvents} />

      <ProgressStepper
        domainId={id}
        currentStep="data-layer"
        canProceedToMapping={progress.canProceedToMapping}
      />

      <div className="mb-8">
        <DataLayerGuide />
      </div>

      <DataLayerInput domainId={id} />
    </div>
  );
}
