import Link from "next/link";
import type { DomainProgress } from "@/lib/services/progress";
import type { UserRole } from "@/lib/auth-types";

interface Props {
  domainId: string;
  progress: DomainProgress;
  role?: UserRole | null;
}

export function NextActionBanner({ domainId, progress, role }: Props) {
  const p = progress;
  const r = role ?? "PRODUCT_MANAGER";

  let message: string;
  let href: string;
  let cta: string;
  let tone: string;

  const commsComplete =
    p.communicationPointsCount > 0 &&
    p.commStepsWithoutComms === 0 &&
    p.communicationsDraft === 0 &&
    p.communicationsTotal > 0;

  if (!p.hasEvents) {
    message = "Start by adding screens and generating events in the Data Layer.";
    href = `/domain/${domainId}/data-layer`;
    cta = "Go to Data Layer";
    tone = "border-[var(--accent)]/30 bg-[var(--accent)]/5";
  } else if (p.journeyStepsCount === 0) {
    message = "Events are ready. Map them into user journeys.";
    href = `/domain/${domainId}/mapping`;
    cta = "Go to Mapping";
    tone = "border-blue-500/30 bg-blue-500/5";
  } else if (p.communicationPointsCount === 0) {
    message = "Journeys are mapped. Define the communications for each step.";
    href = `/domain/${domainId}/communications`;
    cta = "Go to Communications";
    tone = "border-violet-500/30 bg-violet-500/5";
  } else if (p.commStepsWithoutComms > 0) {
    message = `${p.commStepsWithoutComms} communication step${p.commStepsWithoutComms > 1 ? "s" : ""} in your journeys still need communications created.`;
    href = `/domain/${domainId}/communications`;
    cta = "Go to Communications";
    tone = "border-amber-500/30 bg-amber-500/5";
  } else if (p.communicationsDraft > 0) {
    message = `${p.communicationsDraft} communication${p.communicationsDraft > 1 ? "s" : ""} still in draft. Classify and finalize them.`;
    href = `/domain/${domainId}/communications`;
    cta = "Review Drafts";
    tone = "border-amber-500/30 bg-amber-500/5";
  } else if (commsComplete && (r === "ANALYST" || r === "ADMIN")) {
    message = "All phases complete. Review and approve events when ready.";
    href = `/domain/${domainId}/data-layer`;
    cta = "Review Events";
    tone = "border-emerald-500/30 bg-emerald-500/5";
  } else {
    message = "All phases complete. Request analyst approval to export for Braze.";
    href = `/domain/${domainId}/data-layer`;
    cta = "Request Approval";
    tone = "border-emerald-500/30 bg-emerald-500/5";
  }

  return (
    <div className={`rounded-lg border p-4 mb-6 flex items-center justify-between gap-4 flex-wrap ${tone}`}>
      <div className="flex items-center gap-3">
        <span className="text-base">→</span>
        <p className="text-sm text-zinc-300">{message}</p>
      </div>
      <Link
        href={href}
        className="shrink-0 px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-muted)] transition-colors"
      >
        {cta}
      </Link>
    </div>
  );
}
