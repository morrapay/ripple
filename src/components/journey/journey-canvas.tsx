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
  type Node,
  type Edge,
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
  posX: number;
  posY: number;
  imageUrl: string | null;
  behavioralEvents: { behavioralEvent: BehavioralEvent }[];
  applicationEvents: { applicationEvent: ApplicationEvent }[];
  communicationPoints: CommunicationPoint[];
}

interface JourneyRaw {
  id: string;
  name: string;
  description: string | null;
  steps: JourneyStepRaw[];
}

interface JourneyCanvasProps {
  domainId: string;
  journeyId: string;
}

const nodeTypes = { journeyNode: JourneyNode };

function getStepKind(step: JourneyStepRaw): StepKind {
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
      type: "smoothstep",
      animated: true,
      style: { stroke: "#3f3f46", strokeWidth: 2 },
    });
  }
  return edges;
}

export function JourneyCanvas({ domainId, journeyId }: JourneyCanvasProps) {
  const router = useRouter();
  const [journey, setJourney] = useState<JourneyRaw | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [journeyName, setJourneyName] = useState("");
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
      behavioralEvents: step.behavioralEvents,
      applicationEvents: step.applicationEvents,
      communicationPoints: step.communicationPoints,
    };
  }, [selectedStepId, journey]);

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
      const [journeyRes, bRes, aRes] = await Promise.all([
        fetch(`/api/domains/${domainId}/journeys/${journeyId}`),
        fetch(`/api/domains/${domainId}/behavioral-events`),
        fetch(`/api/domains/${domainId}/application-events`),
      ]);

      if (!journeyRes.ok) throw new Error("Failed to fetch journey");
      const jData = await journeyRes.json();
      const j: JourneyRaw = jData.journey;
      setJourney(j);
      setJourneyName(j.name);
      setNodes(stepsToNodes(j.steps));
      setEdges(stepsToEdges(j.steps));

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
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#3f3f46", strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges]
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
            posY: kind === "ACTION" ? 0 : kind === "SYSTEM_TRIGGER" ? 160 : kind === "COMMUNICATION" ? 320 : 480,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to add step");
      const data = await res.json();
      setJourney(data.journey);
      setNodes(stepsToNodes(data.journey.steps));
      setEdges(stepsToEdges(data.journey.steps));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add step");
    }
  }

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
      const data = await res.json();
      setJourney(data.journey);
      setNodes(stepsToNodes(data.journey.steps));
      setEdges(stepsToEdges(data.journey.steps));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  }

  async function handleDeleteStep() {
    if (!selectedStepId) return;
    try {
      const res = await fetch(
        `/api/domains/${domainId}/journeys/${journeyId}/steps/${selectedStepId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      const data = await res.json();
      setSelectedStepId(null);
      setJourney(data.journey);
      setNodes(stepsToNodes(data.journey.steps));
      setEdges(stepsToEdges(data.journey.steps));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
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
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              {journey.steps.length} step{journey.steps.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1">
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
                return "#71717a";
              }}
              maskColor="rgba(0,0,0,0.7)"
              className="!bg-zinc-900 !border-[var(--card-border)] !rounded-lg"
            />

            {/* Floating add-step toolbar */}
            <Panel position="top-left" className="!m-3">
              <div className="flex gap-1.5 p-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] shadow-lg">
                <ToolbarButton
                  label="Action"
                  color="bg-amber-500"
                  onClick={() => handleAddStep("ACTION")}
                />
                <ToolbarButton
                  label="System"
                  color="bg-blue-500"
                  onClick={() => handleAddStep("SYSTEM_TRIGGER")}
                />
                <ToolbarButton
                  label="Comm"
                  color="bg-violet-500"
                  onClick={() => handleAddStep("COMMUNICATION")}
                />
                <ToolbarButton
                  label="State"
                  color="bg-zinc-500"
                  onClick={() => handleAddStep("STATE")}
                />
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Detail panel */}
      {selectedStep && (
        <StepDetailPanel
          step={selectedStep}
          allBehavioralEvents={allBehavioralEvents}
          allApplicationEvents={allApplicationEvents}
          onSave={handleSaveStep}
          onDelete={handleDeleteStep}
          onSplit={handleSplit}
          onClose={() => setSelectedStepId(null)}
        />
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
