"use client";

import Link from "next/link";

const steps = [
  { id: "data-layer", label: "Data Layer" },
  { id: "mapping", label: "Mapping" },
  { id: "communications", label: "Communications" },
];

interface ProgressStepperProps {
  domainId: string;
  currentStep: string;
  canProceedToMapping: boolean;
}

export function ProgressStepper({
  domainId,
  currentStep,
  canProceedToMapping,
}: ProgressStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center gap-2 flex-wrap">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isPast = index < currentIndex;
          const href = `/domain/${domainId}/${step.id}`;

          const stepContent = (
            <>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isActive
                    ? "bg-[var(--accent)] text-white"
                    : isPast
                      ? "bg-zinc-600 text-zinc-200"
                      : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {index + 1}
              </span>
              {step.label}
            </>
          );

          return (
            <li key={step.id} className="flex items-center">
              <Link
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                    : isPast
                      ? "text-zinc-400 hover:text-zinc-200"
                      : "text-zinc-500 hover:text-zinc-300"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {stepContent}
              </Link>
              {index < steps.length - 1 && (
                <span className="mx-1 text-zinc-600">→</span>
              )}
            </li>
          );
        })}
      </ol>
      {!canProceedToMapping && currentIndex >= 0 && (
        <p className="mt-2 text-sm text-zinc-500">
          Note: Data Layer (events + happy/unhappy flows) should be complete before Mapping for best results.
        </p>
      )}
    </nav>
  );
}
