import { notFound } from "next/navigation";
import { getDomainById } from "@/lib/services/domain";
import { getDomainProgress } from "@/lib/services/progress";
import { PhaseChecklist } from "@/components/phase-checklist";
import { NextActionBanner } from "@/components/next-action-banner";
import { StatusBoard } from "@/components/dashboard-status-board";
import { getSessionUser } from "@/lib/get-session";

export default async function DomainDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const domain = await getDomainById(id);
  if (!domain) notFound();

  const [progress, user] = await Promise.all([
    getDomainProgress(id),
    getSessionUser(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
        {domain.name}
      </h1>
      <p className="text-zinc-400 text-sm mb-6">
        {domain.description ?? "No description"}
      </p>

      <PhaseChecklist domainId={id} progress={progress} />
      <NextActionBanner domainId={id} progress={progress} role={user?.role} />

      <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">Status</h2>
      <StatusBoard domainId={id} progress={progress} />
    </div>
  );
}
