import { Router, type Request, type Response } from "express";
import type {
  Journey,
  JourneySummary,
  JourneyStep,
  StepInput,
  CreateJourneyRequest,
  UpdateJourneyRequest,
} from "@ripple/shared";
import { journeys, nextId, now } from "../store";
import { sendOk, sendError, paginate } from "../helpers";

const router = Router();

// ═══════════════════════════════════════════════════════════════
// GET /api/journeys — list summaries (paginated)
// ═══════════════════════════════════════════════════════════════
router.get("/", (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const statusFilter = req.query.status as string | undefined;
  const search = (req.query.search as string || "").toLowerCase();

  let items = Array.from(journeys.values());

  if (statusFilter) {
    items = items.filter((j) => j.status === statusFilter);
  }
  if (search) {
    items = items.filter(
      (j) =>
        j.name.toLowerCase().includes(search) ||
        (j.description ?? "").toLowerCase().includes(search),
    );
  }

  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const summaries: JourneySummary[] = items.map(
    ({ steps: _steps, ...rest }) => rest,
  );

  res.json(paginate(summaries, page, pageSize));
});

// ═══════════════════════════════════════════════════════════════
// GET /api/journeys/:id — single journey with steps
// ═══════════════════════════════════════════════════════════════
router.get("/:id", (req: Request, res: Response) => {
  const journey = journeys.get(req.params.id);
  if (!journey) {
    return sendError(res, { code: "NOT_FOUND", message: "Journey not found" });
  }
  sendOk(res, journey);
});

// ═══════════════════════════════════════════════════════════════
// POST /api/journeys — create
// ═══════════════════════════════════════════════════════════════
router.post("/", (req: Request, res: Response) => {
  const body = req.body as CreateJourneyRequest["body"];

  if (!body.name || !body.name.trim()) {
    return sendError(res, {
      code: "VALIDATION_ERROR",
      message: "Journey name is required",
      fieldErrors: { name: ["Required"] },
    });
  }

  const ts = now();
  const steps: JourneyStep[] = (body.steps ?? []).map((s, i) =>
    inputToStep(s, i, ts),
  );

  const journey: Journey = {
    id: nextId(),
    name: body.name.trim(),
    description: body.description ?? null,
    audience: body.audience ?? null,
    objective: body.objective ?? null,
    status: "draft",
    steps,
    createdAt: ts,
    updatedAt: ts,
  };

  journeys.set(journey.id, journey);
  sendOk(res, journey, 201);
});

// ═══════════════════════════════════════════════════════════════
// PUT /api/journeys/:id — full replacement update
// ═══════════════════════════════════════════════════════════════
router.put("/:id", (req: Request, res: Response) => {
  const existing = journeys.get(req.params.id);
  if (!existing) {
    return sendError(res, { code: "NOT_FOUND", message: "Journey not found" });
  }

  if (existing.status !== "draft") {
    return sendError(res, {
      code: "FORBIDDEN",
      message: `Cannot update a journey in "${existing.status}" status`,
    });
  }

  const body = req.body as UpdateJourneyRequest["body"];
  const ts = now();

  const steps: JourneyStep[] = body.steps
    ? body.steps.map((s, i) => inputToStep(s, i, ts))
    : existing.steps;

  const updated: Journey = {
    ...existing,
    name: body.name ?? existing.name,
    description: body.description !== undefined ? body.description : existing.description,
    audience: body.audience !== undefined ? body.audience : existing.audience,
    objective: body.objective !== undefined ? body.objective : existing.objective,
    status: body.status ?? existing.status,
    steps,
    updatedAt: ts,
  };

  journeys.set(updated.id, updated);
  sendOk(res, updated);
});

// ═══════════════════════════════════════════════════════════════
// DELETE /api/journeys/:id
// ═══════════════════════════════════════════════════════════════
router.delete("/:id", (req: Request, res: Response) => {
  if (!journeys.has(req.params.id)) {
    return sendError(res, { code: "NOT_FOUND", message: "Journey not found" });
  }
  journeys.delete(req.params.id);
  sendOk(res, { deleted: true as const });
});

// ─── helpers ──────────────────────────────────────────────────

function inputToStep(input: StepInput, order: number, ts: string): JourneyStep {
  const base = {
    id: nextId(),
    name: input.name,
    description: input.description ?? null,
    order,
    createdAt: ts,
    updatedAt: ts,
  };

  switch (input.type) {
    case "event":
      return { ...base, type: "event", config: input.config };
    case "delay":
      return { ...base, type: "delay", config: input.config };
    case "communication":
      return { ...base, type: "communication", config: input.config };
  }
}

export default router;
