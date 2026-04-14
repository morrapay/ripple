"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export type StepKind =
  | "ACTION"
  | "SYSTEM_TRIGGER"
  | "COMMUNICATION"
  | "STATE"
  | "DECISION"
  | "WAIT_DELAY"
  | "AB_SPLIT";

export interface JourneyNodeData {
  label: string;
  description?: string;
  kind: StepKind;
  imageUrl?: string;
  selected?: boolean;
  waitDuration?: string;
  splitVariants?: { name: string; percentage: number }[];
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
  DECISION: {
    bg: "bg-emerald-950/60",
    border: "border-emerald-500/40",
    text: "text-emerald-200",
    badge: "bg-emerald-500/20 text-emerald-400",
    label: "Decision",
    icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01",
  },
  WAIT_DELAY: {
    bg: "bg-orange-950/60",
    border: "border-orange-500/40",
    text: "text-orange-200",
    badge: "bg-orange-500/20 text-orange-400",
    label: "Wait / Delay",
    icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  },
  AB_SPLIT: {
    bg: "bg-teal-950/60",
    border: "border-teal-500/40",
    text: "text-teal-200",
    badge: "bg-teal-500/20 text-teal-400",
    label: "A/B Split",
    icon: "M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 0v3a3 3 0 0 1-3 3H9m-3 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  },
};

function JourneyNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as JourneyNodeData;
  const kind = nodeData.kind ?? "STATE";
  const config = KIND_CONFIG[kind];
  const [hovered, setHovered] = useState(false);

  const isDecision = kind === "DECISION";
  const isWait = kind === "WAIT_DELAY";
  const isSplit = kind === "AB_SPLIT";

  return (
    <div
      className={`
        relative border-2 shadow-lg transition-all duration-200
        ${isDecision ? "rounded-lg rotate-0" : "rounded-xl"}
        ${config.bg} ${config.border} ${config.text}
        min-w-[200px] max-w-[260px]
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

        {isWait && nodeData.waitDuration && (
          <p className="text-[11px] mt-1.5 flex items-center gap-1 opacity-75">
            <span>⏱</span> {nodeData.waitDuration}
          </p>
        )}

        {isSplit && nodeData.splitVariants && nodeData.splitVariants.length > 0 && (
          <p className="text-[11px] mt-1.5 opacity-75">
            {nodeData.splitVariants.map((v) => `${v.name}: ${v.percentage}%`).join(" · ")}
          </p>
        )}

        {isDecision && (
          <p className="text-[10px] mt-1.5 opacity-50">Drag from handles to branch →</p>
        )}
      </div>

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

      {/* Source handles */}
      {isDecision ? (
        <>
          {/* Yes handle — right side with label */}
          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-emerald-300 hover:!bg-emerald-400"
          />
          <div className="absolute right-[-28px] top-1/2 -translate-y-1/2 text-[8px] font-bold text-emerald-400 pointer-events-none">
            YES
          </div>
          {/* No handle — bottom with label */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            className="!w-3 !h-3 !bg-red-500 !border-2 !border-red-300 hover:!bg-red-400"
          />
          <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 text-[8px] font-bold text-red-400 pointer-events-none">
            NO
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-400 hover:!bg-[var(--accent)]"
        />
      )}

      {isSplit && nodeData.splitVariants && nodeData.splitVariants.length > 1 && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="variant-b"
            className="!w-3 !h-3 !bg-teal-600 !border-2 !border-teal-400 hover:!bg-teal-500"
          />
          <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 text-[8px] font-bold text-teal-400 pointer-events-none">
            B
          </div>
        </>
      )}
    </div>
  );
}

export const JourneyNode = memo(JourneyNodeComponent);
