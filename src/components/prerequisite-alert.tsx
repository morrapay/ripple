"use client";

interface PrerequisiteAlertProps {
  canProceedToMapping: boolean;
  figmaFlowsHappy: number;
  figmaFlowsUnhappy: number;
  hasEvents: boolean;
}

export function PrerequisiteAlert({
  canProceedToMapping,
  figmaFlowsHappy,
  figmaFlowsUnhappy,
  hasEvents,
}: PrerequisiteAlertProps) {
  if (canProceedToMapping) return null;

  const missing: string[] = [];
  if (figmaFlowsHappy < 1) missing.push("at least one happy flow");
  if (figmaFlowsUnhappy < 1) missing.push("at least one unhappy flow");
  if (!hasEvents) missing.push("at least one event (behavioral or application)");

  return (
    <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
      <p className="text-sm font-medium text-amber-400">
        Mapping is locked until prerequisites are met:
      </p>
      <ul className="mt-2 text-sm text-amber-200/80 list-disc list-inside">
        {missing.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-zinc-400">
        Complete the Data Layer page to upload flows and generate events.
      </p>
    </div>
  );
}
