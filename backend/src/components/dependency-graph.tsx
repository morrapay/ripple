"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const DEP_TYPES = ["MUST_PRECEDE", "MUTUALLY_EXCLUSIVE", "TRIGGERS"] as const;
type DepType = (typeof DEP_TYPES)[number];

interface CommBrief {
  id: string;
  name: string;
  channel: string | null;
  status: string;
}

interface DependencyRow {
  id: string;
  type: DepType;
  fromCommunication: CommBrief;
  toCommunication: CommBrief;
}

interface CommunicationOption {
  id: string;
  name: string;
  channel: string | null;
  status: string;
}

function buildEdge(dep: DependencyRow): Edge {
  const label = dep.type;
  const labelStyle = { fill: "#a1a1aa", fontSize: 11, fontWeight: 500 as const };
  const labelBgStyle = { fill: "#18181c", fillOpacity: 0.92 };

  switch (dep.type) {
    case "MUST_PRECEDE":
      return {
        id: dep.id,
        source: dep.fromCommunication.id,
        target: dep.toCommunication.id,
        type: "smoothstep",
        label,
        labelStyle,
        labelBgStyle,
        style: { stroke: "#3b82f6", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#3b82f6",
          width: 20,
          height: 20,
        },
      };
    case "MUTUALLY_EXCLUSIVE":
      return {
        id: dep.id,
        source: dep.fromCommunication.id,
        target: dep.toCommunication.id,
        type: "smoothstep",
        label,
        labelStyle,
        labelBgStyle,
        style: {
          stroke: "#ef4444",
          strokeWidth: 2,
          strokeDasharray: "8 4",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#ef4444",
          width: 20,
          height: 20,
        },
      };
    case "TRIGGERS":
      return {
        id: dep.id,
        source: dep.fromCommunication.id,
        target: dep.toCommunication.id,
        type: "smoothstep",
        label,
        labelStyle,
        labelBgStyle,
        style: { stroke: "#22c55e", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#22c55e",
          width: 20,
          height: 20,
        },
      };
  }
}

function layoutNodes(commMap: Map<string, CommBrief>): Node[] {
  const ids = [...commMap.keys()];
  const n = ids.length;
  const cx = 400;
  const cy = 280;
  const r = n <= 1 ? 0 : Math.max(130, Math.min(280, 48 * Math.sqrt(n)));

  return ids.map((id, i) => {
    const c = commMap.get(id)!;
    const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
    const x = cx + r * Math.cos(angle) - 110;
    const y = cy + r * Math.sin(angle) - 36;
    const sub = [c.channel ?? "—", c.status].join(" · ");
    return {
      id,
      type: "default",
      position: { x, y },
      style: {
        background: "var(--card)",
        border: "1px solid var(--card-border)",
        borderRadius: 8,
        color: "var(--foreground)",
        fontSize: 12,
        padding: "8px 12px",
        maxWidth: 220,
      },
      data: {
        label: `${c.name}\n${sub}`,
      },
    };
  });
}

function buildCommMap(
  dependencies: DependencyRow[],
  communications: CommunicationOption[]
): Map<string, CommBrief> {
  const map = new Map<string, CommBrief>();
  for (const c of communications) {
    map.set(c.id, {
      id: c.id,
      name: c.name,
      channel: c.channel,
      status: c.status,
    });
  }
  for (const d of dependencies) {
    map.set(d.fromCommunication.id, d.fromCommunication);
    map.set(d.toCommunication.id, d.toCommunication);
  }
  return map;
}

function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node>;
  onEdgesChange: OnEdgesChange<Edge>;
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!nodes.length) return;
    const id = requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 280 });
    });
    return () => cancelAnimationFrame(id);
  }, [nodes, edges, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      nodesConnectable={false}
      proOptions={{ hideAttribution: true }}
      className="rounded-lg border border-[var(--card-border)] bg-[var(--card)]"
      style={{ minHeight: 320 }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#3f3f46" />
      <Controls className="!bg-zinc-900/90 !border-zinc-700" />
      <MiniMap
        className="!bg-zinc-900/80 !rounded-md !border-zinc-700"
        nodeColor={() => "#52525b"}
        maskColor="rgba(15, 15, 18, 0.65)"
      />
    </ReactFlow>
  );
}

function DependencyGraphInner({ domainId }: { domainId: string }) {
  const [dependencies, setDependencies] = useState<DependencyRow[]>([]);
  const [communications, setCommunications] = useState<CommunicationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [depType, setDepType] = useState<DepType>("MUST_PRECEDE");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [depRes, commRes] = await Promise.all([
        fetch(`/api/domains/${domainId}/communication-dependencies`),
        fetch(`/api/domains/${domainId}/communications`),
      ]);
      if (!depRes.ok) throw new Error("Failed to load dependencies");
      if (!commRes.ok) throw new Error("Failed to load communications");
      const depData = await depRes.json();
      const commData = await commRes.json();
      setDependencies(depData.dependencies ?? []);
      const comms = (commData.communications ?? []) as CommunicationOption[];
      setCommunications(comms);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    void load();
  }, [load]);

  const commMap = useMemo(
    () => buildCommMap(dependencies, communications),
    [dependencies, communications]
  );

  useEffect(() => {
    const nextNodes = layoutNodes(commMap);
    const nextEdges = dependencies.map(buildEdge);
    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [commMap, dependencies, setNodes, setEdges]);

  const addDependency = async () => {
    if (!fromId || !toId || fromId === toId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/domains/${domainId}/communication-dependencies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromCommunicationId: fromId,
            toCommunicationId: toId,
            type: depType,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to add dependency");
      }
      setFromId("");
      setToId("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSubmitting(false);
    }
  };

  const removeDependency = async (depId: string) => {
    setDeletingId(depId);
    setError(null);
    try {
      const res = await fetch(
        `/api/domains/${domainId}/communication-dependencies/${depId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const selectClass =
    "w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="min-h-[360px] flex-1">
        {loading ? (
          <div className="flex h-[360px] items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-zinc-500">
            Loading graph…
          </div>
        ) : (
          <div className="h-[360px] w-full">
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
            />
          </div>
        )}
      </div>

      <aside className="w-full shrink-0 space-y-4 lg:w-[340px]">
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-200">Add dependency</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">From</label>
              <select
                className={selectClass}
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
              >
                <option value="">Select communication…</option>
                {communications.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">To</label>
              <select
                className={selectClass}
                value={toId}
                onChange={(e) => setToId(e.target.value)}
              >
                <option value="">Select communication…</option>
                {communications.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Type</label>
              <select
                className={selectClass}
                value={depType}
                onChange={(e) => setDepType(e.target.value as DepType)}
              >
                {DEP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={submitting || !fromId || !toId || fromId === toId}
              onClick={() => void addDependency()}
              className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add"}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-200">Dependencies</h3>
          {dependencies.length === 0 ? (
            <p className="text-sm text-zinc-500">No dependencies yet.</p>
          ) : (
            <ul className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {dependencies.map((d) => (
                <li
                  key={d.id}
                  className="flex items-start justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-zinc-200">
                      {d.fromCommunication.name}
                      <span className="text-zinc-500"> → </span>
                      {d.toCommunication.name}
                    </div>
                    <div className="text-xs text-zinc-500">{d.type.replace(/_/g, " ")}</div>
                  </div>
                  <button
                    type="button"
                    disabled={deletingId === d.id}
                    onClick={() => void removeDependency(d.id)}
                    className="shrink-0 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:border-red-900 hover:bg-red-950/40 hover:text-red-300 disabled:opacity-50"
                  >
                    {deletingId === d.id ? "…" : "Delete"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </aside>
    </div>
  );
}

/** Communication dependency graph: React Flow canvas + add/delete controls. */
export function DependencyGraph({ domainId }: { domainId: string }) {
  return (
    <ReactFlowProvider>
      <DependencyGraphInner domainId={domainId} />
    </ReactFlowProvider>
  );
}
