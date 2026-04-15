"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BaseEdge,
  getSmoothStepPath,
  type Node,
  type Edge,
  type EdgeProps,
  type Connection,
  type NodeChange,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { JourneyNode, type StepKind, type JourneyNodeData } from "./journey-node";
import {
  StepDetailPanel,
  type SelectedStepData,
} from "./step-detail-panel";

interface BehavioralEvent {
  id: string;
  eventName: string;
  eventType: string;
  description: string | null;
}

interface ApplicationEvent {
  id: string;
  eventName: string;
  eventType: string;
  description: string | null;
}

interface CommunicationPoint {
  id: string;
  name: string;
  triggerEvent: string | null;
}

interface JourneyStepRaw {
  id: string;
  order: number;
  name: string;
  description: string | null;
  kind: string;
  posX: number;
  posY: number;
  imageUrl: string | null;
  waitDuration: string | null;
  splitVariants: { name: string; percentage: number }[] | null;
  conditionConfig: Record<string, unknown> | null;
  behavioralEvents: { behavioralEvent: BehavioralEvent }[];
  applicationEvents: { applicationEvent: ApplicationEvent }[];
  communicationPoints: CommunicationPoint[];
}

interface EntryCriteria {
  triggerEvent?: string;
  conditions?: string;
}

interface ExitCriteria {
  type?: "timeout" | "event" | "manual";
  timeoutDuration?: string;
  exitEvent?: string;
}

interface JourneyRaw {
  id: string;
  name: string;
  description: string | null;
  audience: string | null;
  objective: string | null;
  entryCriteria: EntryCriteria | null;
  exitCriteria: ExitCriteria | null;
  steps: JourneyStepRaw[];
}

interface JourneyCanvasProps {
  domainId: string;
  journeyId: string;
}

const nodeTypes = { journeyNode: JourneyNode };

const insertHandlerRef: { current: ((order: number, x: number, y: number) => void) | null } = { current: null };
const insertBusyRef: { current: boolean } = { current: false };

function InsertableEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd } = props;
  const data = props.data as { sourceOrder?: number } | undefined;
  const [busy, setBusy] = useState(false);

  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const btnSize = 28;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ stroke: "#3f3f46", strokeWidth: 2 }} />
      <foreignObject
        x={midX - btnSize / 2}
        y={midY - btnSize / 2}
        width={btnSize}
        height={btnSize}
        style={{ overflow: "visible" }}
      >
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}
        >
          {busy ? (
            <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          ) : (
            <button
              type="button"
              className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-400 flex items-center justify-center text-sm leading-none hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white transition-all duration-150 cursor-pointer hover:scale-110"
              onClick={async (e) => {
                e.stopPropagation();
                if (insertBusyRef.current) return;
                insertBusyRef.current = true;
                setBusy(true);
                try {
                  await insertHandlerRef.current?.(data?.sourceOrder ?? 0, midX, midY);
                } finally {
                  insertBusyRef.current = false;
                  setBusy(false);
                }
              }}
              title="Insert step here"
            >
              +
            </button>
          )}
        </div>
      </foreignObject>
    </>
  );
}

const edgeTypes = { insertable: InsertableEdge };

const VALID_KINDS = new Set<StepKind>(["ACTION", "SYSTEM_TRIGGER", "COMMUNICATION", "STATE", "DECISION", "WAIT_DELAY", "AB_SPLIT"]);

function getStepKind(step: JourneyStepRaw): StepKind {
  const stored = step.kind as StepKind;
  if (stored && VALID_KINDS.has(stored) && stored !== "STATE") return stored;
  if (step.behavioralEvents.length > 0) return "ACTION";
  if (step.applicationEvents.length > 0) return "SYSTEM_TRIGGER";
  if (step.communicationPoints.length > 0) return "COMMUNICATION";
  return "STATE";
}

function stepsToNodes(steps: JourneyStepRaw[]): Node[] {
  return steps.map((step) => ({
    id: step.id,
    type: "journeyNode",
    position: { x: step.posX, y: step.posY },
    data: {
      label: step.name,
      description: step.description ?? undefined,
      kind: getStepKind(step),
      imageUrl: step.imageUrl ?? undefined,
      waitDuration: step.waitDuration ?? undefined,
      splitVariants: step.splitVariants ?? undefined,
    } satisfies JourneyNodeData,
  }));
}

function stepsToEdges(steps: JourneyStepRaw[]): Edge[] {
  const edges: Edge[] = [];
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  for (let i = 0; i < sorted.length - 1; i++) {
    edges.push({
      id: `e-${sorted[i].id}-${sorted[i + 1].id}`,
      source: sorted[i].id,
      target: sorted[i + 1].id,
      type: "insertable",
      animated: true,
      data: { sourceOrder: sorted[i].order },
    });
  }
  return edges;
}

export function JourneyCanvas({ domainId, journeyId }: JourneyCanvasProps) {
  const router = useRouter();
  const [journey, setJourney] = useState<JourneyRaw | null>(null);
  const journeyRef = useRef<JourneyRaw | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [journeyName, setJourneyName] = useState("");
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [editAudience, setEditAudience] = useState("");
  const [editObjective, setEditObjective] = useState("");
  const [entryCriteria, setEntryCriteria] = useState<EntryCriteria>({});
  const [exitCriteria, setExitCriteria] = useState<ExitCriteria>({});
  const [allBehavioralEvents, setAllBehavioralEvents] = useState<BehavioralEvent[]>([]);
  const [allApplicationEvents, setAllApplicationEvents] = useState<ApplicationEvent[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const selectedStep = useMemo<SelectedStepData | null>(() => {
    if (!selectedStepId || !journey) return null;
    const step = journey.steps.find((s) => s.id === selectedStepId);
    if (!step) return null;
    return {
      id: step.id,
      name: step.name,
      description: step.description,
      kind: getStepKind(step),
      imageUrl: step.imageUrl,
      waitDuration: step.waitDuration,
      splitVariants: step.splitVariants,
      conditionConfig: step.conditionConfig,
      behavioralEvents: step.behavioralEvents,
      applicationEvents: step.applicationEvents,
      communicationPoints: step.communicationPoints,
    };
  }, [selectedStepId, journey]);

  useEffect(() => {
    journeyRef.current = journey;
  }, [journey]);

  useEffect(() => {
    fetchAll();
  }, [domainId, journeyId]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  async function fetchAll() {
    try {
      setLoading(true);
      setError(null);
      const [journeyRes, bRes, aRes, edgesRes] = await Promise.all([
        fetch(`/api/domains/${domainId}/journeys/${journeyId}`),
        fetch(`/api/domains/${domainId}/behavioral-events`),
        fetch(`/api/domains/${domainId}/application-events`),
        fetch(`/api/domains/${domainId}/journeys/${journeyId}/edges`),
      ]);

      if (!journeyRes.ok) throw new Error("Failed to fetch journey");
      const jData = await journeyRes.json();
      const j: JourneyRaw = jData.journey;
      setJourney(j);
      setJourneyName(j.name);
      setEntryCriteria((j.entryCriteria as EntryCriteria) ?? {});
      setExitCriteria((j.exitCriteria as ExitCriteria) ?? {});
      setNodes(stepsToNodes(j.steps));

      const orderEdges = stepsToEdges(j.steps);
      const dbEdges: Edge[] = [];
      if (edgesRes.ok) {
        const eData = await edgesRes.json().catch(() => ({ edges: [] }));
        const rawEdges = Array.isArray(eData.edges) ? eData.edges : [];
        const orderEdgeIds = new Set(orderEdges.map((e) => `${e.source}-${e.target}`));
        for (const re of rawEdges) {
          const key = `${re.sourceStepId}-${re.targetStepId}`;
          if (orderEdgeIds.has(key)) continue;
          const isYes = re.label === "Yes";
          const isNo = re.label === "No";
          dbEdges.push({
            id: re.id,
            source: re.sourceStepId,
            target: re.targetStepId,
            sourceHandle: isYes ? "yes" : isNo ? "no" : undefined,
            type: "default",
            animated: true,
            label: re.label ?? undefined,
            style: isYes ? { stroke: "#10b981" } : isNo ? { stroke: "#ef4444" } : undefined,
            labelStyle: (isYes || isNo) ? { fill: isYes ? "#10b981" : "#ef4444", fontWeight: 600, fontSize: 11 } : undefined,
          });
        }
      }
      setEdges([...orderEdges, ...dbEdges]);

      const bData = await bRes.json().catch(() => ({ events: [] }));
      const aData = await aRes.json().catch(() => ({ events: [] }));
      setAllBehavioralEvents(bData.events ?? []);
      setAllApplicationEvents(aData.events ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  const onConnect = useCallback(
    (connection: Connection) => {
      const isDecisionYes = connection.sourceHandle === "yes";
      const isDecisionNo = connection.sourceHandle === "no";
      const isBranch = isDecisionYes || isDecisionNo;

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: isBranch ? "default" : "insertable",
            animated: true,
            label: isDecisionYes ? "Yes" : isDecisionNo ? "No" : undefined,
            style: isDecisionYes
              ? { stroke: "#10b981" }
              : isDecisionNo
                ? { stroke: "#ef4444" }
                : undefined,
            labelStyle: isBranch
              ? { fill: isDecisionYes ? "#10b981" : "#ef4444", fontWeight: 600, fontSize: 11 }
              : undefined,
          },
          eds
        )
      );

      // Persist edge to DB
      if (connection.source && connection.target) {
        fetch(`/api/domains/${domainId}/journeys/${journeyId}/edges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceStepId: connection.source,
            targetStepId: connection.target,
            sourceHandle: connection.sourceHandle ?? null,
            label: isDecisionYes ? "Yes" : isDecisionNo ? "No" : null,
          }),
        }).catch(() => {});
      }
    },
    [setEdges, domainId, journeyId]
  );

  const onNodeDragStop = useCallback(
    async (_event: React.MouseEvent, node: Node) => {
      try {
        await fetch(
          `/api/domains/${domainId}/journeys/${journeyId}/steps/${node.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              posX: node.position.x,
              posY: node.position.y,
            }),
          }
        );
      } catch {
        // Position save is best-effort
      }
    },
    [domainId, journeyId]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      for (const c of changes) {
        if (c.type === "select" && "id" in c && (c as { selected?: boolean }).selected) {
          setSelectedStepId(c.id);
          break;
        }
      }
    },
    [onNodesChange]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedStepId(node.id);
    },
    []
  );

  const handlePaneClick = useCallback(() => {
    setSelectedStepId(null);
  }, []);

  async function handleAddStep(kind: StepKind) {
    setMutating(true);
    try {
      const existingNodes = nodes;
      const maxX = existingNodes.reduce(
        (max, n) => Math.max(max, n.position.x),
        0
      );
      const res = await fetch(
        `/api/domains/${domainId}/journeys/${journeyId}/steps`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `New ${kind.toLowerCase().replace("_", " ")}`,
            kind,
            posX: maxX + 280,
            posY: kind === "ACTION" ? 0 : kind === "SYSTEM_TRIGGER" ? 160 : kind === "COMMUNICATION" ? 320 : kind === "DECISION" ? 480 : kind === "WAIT_DELAY" ? 560 : kind === "AB_SPLIT" ? 640 : 480,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to add step");
      await res.json();
      await fetchAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add step");
    } finally {
      setMutating(false);
    }
  }

  const handleInsertStep = useCallback(
    async (sourceOrder: number, _midX: number, _midY: number) => {
      const currentJourney = journeyRef.current;
      if (!currentJourney) return;
      setMutating(true);
      try {
        const GAP = 280;
        const sorted = [...currentJourney.steps].sort((a, b) => a.order - b.order);
        const sourceStep = sorted.find((s) => s.order === sourceOrder);
        const newPosX = sourceStep ? sourceStep.posX + GAP : _midX;
        const newPosY = sourceStep ? sourceStep.posY : _midY;

        const stepsToShift = sorted.filter((s) => s.order > sourceOrder);
        await Promise.all(
          stepsToShift.map((s) =>
            fetch(
              `/api/domains/${domainId}/journeys/${journeyId}/steps/${s.id}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ posX: s.posX + GAP }),
              }
            )
          )
        );

        const res = await fetch(
          `/api/domains/${domainId}/journeys/${journeyId}/steps`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "New state",
              kind: "STATE",
              posX: newPosX,
              posY: newPosY,
              insertAfterOrder: sourceOrder,
            }),
          }
        );
        if (!res.ok) throw new Error("Failed to insert step");
        await res.json();
        await fetchAll();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to insert step");
      } finally {
        setMutating(false);
      }
    },
    [domainId, journeyId]
  );

  insertHandlerRef.current = handleInsertStep;

  async function handleSaveStep(payload: Record<string, unknown>) {
    if (!selectedStepId) return;
    try {
      const res = await fetch(
        `/api/domains/${domainId}/journeys/${journeyId}/steps/${selectedStepId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to save");
      await res.json();
      await fetchAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  }

  async function handleDeleteStep() {
    if (!selectedStepId) return;
    setMutating(true);
    try {
      const res = await fetch(
        `/api/domains/${domainId}/journeys/${journeyId}/steps/${selectedStepId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `Delete failed (${res.status})`);
      }
      await res.json();
      setSelectedStepId(null);
      await fetchAll();
    } catch (e) {
      console.error("Delete step error:", e);
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setMutating(false);
    }
  }

  async function handleSplit() {
    if (!selectedStepId) return;
    try {
      const res = await fetch(
        `/api/domains/${domainId}/journeys/${journeyId}/split`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepId: selectedStepId }),
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "Failed to split");
      }
      const data = await res.json();
      setSelectedStepId(null);
      // Refresh current journey (it now has fewer steps)
      await fetchAll();
      if (data.newJourney?.id) {
        const goToNew = confirm(
          "Journey split successfully! Go to the new journey?"
        );
        if (goToNew) {
          router.push(`/domain/${domainId}/mapping/${data.newJourney.id}`);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to split journey");
    }
  }

  function openInfoModal() {
    setEditAudience(journey?.audience ?? "");
    setEditObjective(journey?.objective ?? "");
    setShowInfoModal(true);
  }

  async function handleRenameJourney() {
    setEditingName(false);
    if (journeyName.trim() === journey?.name) return;
    try {
      await fetch(`/api/domains/${domainId}/journeys/${journeyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: journeyName.trim() || "Untitled" }),
      });
    } catch {
      // Best effort
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-zinc-500">Loading canvas...</span>
        </div>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error ?? "Journey not found"}</p>
          <button
            type="button"
            onClick={() => router.push(`/domain/${domainId}/mapping`)}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col relative">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--card-border)] bg-[var(--card)]/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/domain/${domainId}/mapping`)}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Back to dashboard"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>

            <div>
              {editingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={journeyName}
                  onChange={(e) => setJourneyName(e.target.value)}
                  onBlur={handleRenameJourney}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameJourney();
                    if (e.key === "Escape") {
                      setJourneyName(journey.name);
                      setEditingName(false);
                    }
                  }}
                  className="text-lg font-medium bg-transparent border-b border-[var(--accent)] text-zinc-200 outline-none px-1"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="text-lg font-medium text-zinc-200 hover:text-white transition-colors"
                  title="Click to rename"
                >
                  {journey.name}
                </button>
              )}
              <div className="flex items-center gap-3 mt-0.5">
                {journey.audience && (
                  <span className="text-[10px] text-zinc-500">
                    <span className="text-zinc-600 font-medium">Audience:</span> {journey.audience}
                  </span>
                )}
                {journey.objective && (
                  <span className="text-[10px] text-zinc-500">
                    <span className="text-zinc-600 font-medium">Objective:</span> {journey.objective}
                  </span>
                )}
                {!journey.audience && !journey.objective && (
                  <button
                    type="button"
                    onClick={openInfoModal}
                    className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    + Add audience & objective
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              {journey.steps.length} step{journey.steps.length !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={openInfoModal}
              className="px-2.5 py-1.5 rounded-md border border-zinc-700 text-zinc-400 text-xs hover:bg-zinc-800 hover:text-zinc-200 transition-colors flex items-center gap-1.5"
              title="Edit journey details"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Details
            </button>
            <button
              type="button"
              onClick={() => setShowCriteriaModal(true)}
              className="px-2.5 py-1.5 rounded-md border border-zinc-700 text-zinc-400 text-xs hover:bg-zinc-800 hover:text-zinc-200 transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
              Entry / Exit Criteria
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          {mutating && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px] pointer-events-auto">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] shadow-xl">
                <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-zinc-300">Updating...</span>
              </div>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.1}
            maxZoom={2}
            snapToGrid
            snapGrid={[20, 20]}
            className="bg-[var(--background)]"
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#27272a"
            />
            <Controls
              className="!bg-[var(--card)] !border-[var(--card-border)] !rounded-lg !shadow-lg [&>button]:!bg-[var(--card)] [&>button]:!border-[var(--card-border)] [&>button]:!text-zinc-400 [&>button:hover]:!bg-zinc-800"
            />
            <MiniMap
              nodeColor={(node) => {
                const kind = (node.data as JourneyNodeData)?.kind;
                if (kind === "ACTION") return "#f59e0b";
                if (kind === "SYSTEM_TRIGGER") return "#3b82f6";
                if (kind === "COMMUNICATION") return "#8b5cf6";
                if (kind === "DECISION") return "#10b981";
                if (kind === "WAIT_DELAY") return "#f97316";
                if (kind === "AB_SPLIT") return "#14b8a6";
                return "#71717a";
              }}
              maskColor="rgba(0,0,0,0.7)"
              className="!bg-zinc-900 !border-[var(--card-border)] !rounded-lg"
            />

            {/* Floating add-step toolbar */}
            <Panel position="top-left" className="!m-3">
              <div className="flex flex-wrap gap-1.5 p-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] shadow-lg max-w-[420px]">
                <ToolbarButton label="Action" color="bg-amber-500" onClick={() => handleAddStep("ACTION")} />
                <ToolbarButton label="System" color="bg-blue-500" onClick={() => handleAddStep("SYSTEM_TRIGGER")} />
                <ToolbarButton label="Comm" color="bg-violet-500" onClick={() => handleAddStep("COMMUNICATION")} />
                <ToolbarButton label="State" color="bg-zinc-500" onClick={() => handleAddStep("STATE")} />
                <div className="w-px bg-zinc-700 mx-0.5" />
                <ToolbarButton label="Decision" color="bg-emerald-500" onClick={() => handleAddStep("DECISION")} />
                <ToolbarButton label="Wait" color="bg-orange-500" onClick={() => handleAddStep("WAIT_DELAY")} />
                <ToolbarButton label="A/B Split" color="bg-teal-500" onClick={() => handleAddStep("AB_SPLIT")} />
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Detail panel */}
      {selectedStep && (
        <StepDetailPanel
          step={selectedStep}
          domainId={domainId}
          allBehavioralEvents={allBehavioralEvents}
          allApplicationEvents={allApplicationEvents}
          onSave={handleSaveStep}
          onDelete={handleDeleteStep}
          onSplit={handleSplit}
          onClose={() => setSelectedStepId(null)}
        />
      )}

      {/* Journey Details Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowInfoModal(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-200">Journey Details</h3>
              <button onClick={() => setShowInfoModal(false)} className="p-1 rounded hover:bg-zinc-800 text-zinc-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-zinc-400">Audience</span>
                <input
                  type="text"
                  value={editAudience}
                  onChange={(e) => setEditAudience(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none"
                  placeholder="e.g. New users who haven't completed KYC"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-zinc-400">Objective</span>
                <textarea
                  value={editObjective}
                  onChange={(e) => setEditObjective(e.target.value)}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none resize-none"
                  placeholder="e.g. Guide users through identity verification to increase completion rate"
                />
              </label>
            </div>
            <div className="px-5 py-4 border-t border-zinc-800 flex gap-2 justify-end">
              <button onClick={() => setShowInfoModal(false)} className="px-3 py-2 rounded-md text-xs text-zinc-400 hover:bg-zinc-800 transition-colors">Cancel</button>
              <button
                onClick={async () => {
                  try {
                    await fetch(`/api/domains/${domainId}/journeys/${journeyId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ audience: editAudience.trim(), objective: editObjective.trim() }),
                    });
                    setShowInfoModal(false);
                    fetchAll();
                  } catch { /* ignore */ }
                }}
                className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-muted)] transition-colors"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entry / Exit Criteria Modal */}
      {showCriteriaModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowCriteriaModal(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-2xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-200">Entry / Exit Criteria</h3>
              <button onClick={() => setShowCriteriaModal(false)} className="p-1 rounded hover:bg-zinc-800 text-zinc-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-5">
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Entry Criteria</p>
                <label className="block text-xs text-zinc-500 mb-1">Trigger Event</label>
                <select
                  value={entryCriteria.triggerEvent ?? ""}
                  onChange={(e) => setEntryCriteria({ ...entryCriteria, triggerEvent: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="">Select event...</option>
                  {allApplicationEvents.map((ev) => (
                    <option key={ev.id} value={ev.eventName}>{ev.eventName}</option>
                  ))}
                </select>
                <label className="block text-xs text-zinc-500 mt-2 mb-1">Additional Conditions</label>
                <input
                  type="text"
                  value={entryCriteria.conditions ?? ""}
                  onChange={(e) => setEntryCriteria({ ...entryCriteria, conditions: e.target.value })}
                  placeholder="e.g. user.segment = 'new'"
                  className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Exit Criteria</p>
                <label className="block text-xs text-zinc-500 mb-1">Exit Type</label>
                <select
                  value={exitCriteria.type ?? ""}
                  onChange={(e) => setExitCriteria({ ...exitCriteria, type: (e.target.value || undefined) as ExitCriteria["type"] })}
                  className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="">Select exit type...</option>
                  <option value="timeout">Timeout</option>
                  <option value="event">Event-based</option>
                  <option value="manual">Manual</option>
                </select>
                {exitCriteria.type === "timeout" && (
                  <>
                    <label className="block text-xs text-zinc-500 mt-2 mb-1">Timeout Duration</label>
                    <input
                      type="text"
                      value={exitCriteria.timeoutDuration ?? ""}
                      onChange={(e) => setExitCriteria({ ...exitCriteria, timeoutDuration: e.target.value })}
                      placeholder="e.g. 30 days"
                      className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none"
                    />
                  </>
                )}
                {exitCriteria.type === "event" && (
                  <>
                    <label className="block text-xs text-zinc-500 mt-2 mb-1">Exit Event</label>
                    <select
                      value={exitCriteria.exitEvent ?? ""}
                      onChange={(e) => setExitCriteria({ ...exitCriteria, exitEvent: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 focus:border-[var(--accent)] focus:outline-none"
                    >
                      <option value="">Select event...</option>
                      {allApplicationEvents.map((ev) => (
                        <option key={ev.id} value={ev.eventName}>{ev.eventName}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-zinc-800 flex gap-2 justify-end">
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="px-3 py-2 rounded-md text-xs text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetch(`/api/domains/${domainId}/journeys/${journeyId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ entryCriteria, exitCriteria }),
                    });
                    setShowCriteriaModal(false);
                    fetchAll();
                  } catch { /* ignore */ }
                }}
                className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-muted)] transition-colors"
              >
                Save Criteria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
      title={`Add ${label} step`}
    >
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </button>
  );
}
