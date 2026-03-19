"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export type StepKind = "ACTION" | "SYSTEM_TRIGGER" | "COMMUNICATION" | "STATE";

export interface JourneyNodeData {
  label: string;
  description?: string;
  kind: StepKind;
  imageUrl?: string;
  selected?: boolean;
  [key: string]: unknown;
}

const KIND_CONFIG: Record<
  StepKind,
  { bg: string; border: string; text: string; badge: string; label: string; icon: string }
> = {
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

function JourneyNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as JourneyNodeData;
  const kind = nodeData.kind ?? "STATE";
  const config = KIND_CONFIG[kind];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`
        relative rounded-xl border-2 ${config.bg} ${config.border} ${config.text}
        min-w-[200px] max-w-[260px] shadow-lg
        transition-all duration-200
        ${selected ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)] scale-105" : "hover:scale-[1.02]"}
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-400 hover:!bg-[var(--accent)]"
      />

      {nodeData.imageUrl && (
        <div className="relative">
          <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-0.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 shrink-0">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span className="text-[10px] opacity-40">Has screenshot</span>
          </div>
        </div>
      )}

      <div className="px-3.5 py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${config.badge}`}>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={config.icon} />
            </svg>
            {config.label}
          </span>
        </div>

        <p className="text-sm font-medium leading-tight truncate">
          {nodeData.label}
        </p>

        {nodeData.description && (
          <p className="text-[11px] opacity-60 mt-1 line-clamp-2 leading-snug">
            {nodeData.description}
          </p>
        )}
      </div>

      {/* Hover image preview popover */}
      {nodeData.imageUrl && hovered && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-50 pointer-events-none animate-in fade-in"
          style={{ animation: "fadeScale 0.15s ease-out" }}
        >
          <div className="rounded-xl overflow-hidden border-2 border-zinc-600 shadow-2xl bg-zinc-900 max-w-[360px]">
            <img
              src={nodeData.imageUrl}
              alt="Step screenshot"
              className="w-full max-h-[240px] object-contain"
            />
          </div>
          <div className="w-3 h-3 bg-zinc-900 border-b-2 border-r-2 border-zinc-600 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-[7px]" />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-400 hover:!bg-[var(--accent)]"
      />
    </div>
  );
}

export const JourneyNode = memo(JourneyNodeComponent);
