import { notFound } from "next/navigation";
import { getDomainById } from "@/lib/services/domain";
import { getDomainProgress } from "@/lib/services/progress";
import { ProgressStepper } from "@/components/progress-stepper";
import { CommunicationsManagement } from "@/components/communications-management";

export default async function CommunicationsPage({
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
      <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">
        Communications
      </h1>
      <p className="text-zinc-400 text-sm mb-6">
        Classify, manage content, and preview communications triggered from the journey mapping area.
      </p>

      <ProgressStepper
        domainId={id}
        currentStep="communications"
        canProceedToMapping={progress.canProceedToMapping}
      />

      <CommunicationsManagement domainId={id} />
    </div>
  );
}
