export type StepKind = "ACTION" | "SYSTEM_TRIGGER" | "COMMUNICATION" | "STATE";

export const STEP_KINDS: StepKind[] = ["ACTION", "SYSTEM_TRIGGER", "COMMUNICATION", "STATE"];

export const KIND_LABELS: Record<StepKind, string> = {
  ACTION: "Action",
  SYSTEM_TRIGGER: "System Trigger",
  COMMUNICATION: "Communication",
  STATE: "State",
};

export const KIND_COLORS: Record<StepKind, {
  bg: string;
  border: string;
  text: string;
  dot: string;
  badge: string;
}> = {
  ACTION: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-300",
    dot: "bg-amber-400",
    badge: "bg-amber-500/20 text-amber-400",
  },
  SYSTEM_TRIGGER: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-300",
    dot: "bg-blue-400",
    badge: "bg-blue-500/20 text-blue-400",
  },
  COMMUNICATION: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-300",
    dot: "bg-violet-400",
    badge: "bg-violet-500/20 text-violet-400",
  },
  STATE: {
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/30",
    text: "text-zinc-400",
    dot: "bg-zinc-400",
    badge: "bg-zinc-500/20 text-zinc-400",
  },
};

export const KIND_NODE_STYLES: Record<StepKind, {
  bg: string;
  border: string;
  text: string;
  badge: string;
  label: string;
  icon: string;
}> = {
  ACTION: {
    bg: "bg-amber-950/60",
    border: "border-amber-500/40",
    text: "text-amber-200",
    badge: "bg-amber-500/20 text-amber-400",
    label: "Action",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  SYSTEM_TRIGGER: {
    bg: "bg-blue-950/60",
    border: "border-blue-500/40",
    text: "text-blue-200",
    badge: "bg-blue-500/20 text-blue-400",
    label: "System Trigger",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  },
  COMMUNICATION: {
    bg: "bg-violet-950/60",
    border: "border-violet-500/40",
    text: "text-violet-200",
    badge: "bg-violet-500/20 text-violet-400",
    label: "Communication",
    icon: "M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z",
  },
  STATE: {
    bg: "bg-zinc-800/80",
    border: "border-zinc-500/40",
    text: "text-zinc-300",
    badge: "bg-zinc-500/20 text-zinc-400",
    label: "State",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  },
};
