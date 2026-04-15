import { Router, type Request, type Response } from "express";
import { events } from "../store";
import { paginate } from "../helpers";

const router = Router();

// ═══════════════════════════════════════════════════════════════
// GET /api/events — list event definitions (paginated)
// ═══════════════════════════════════════════════════════════════
router.get("/", (_req: Request, res: Response) => {
  const page = parseInt(_req.query.page as string) || 1;
  const pageSize = parseInt(_req.query.pageSize as string) || 20;
  const category = _req.query.category as string | undefined;
  const status = (_req.query.status as string) || "active";
  const search = (_req.query.search as string || "").toLowerCase();

  let items = Array.from(events.values());

  items = items.filter((e) => e.status === status);

  if (category) {
    items = items.filter((e) => e.category === category);
  }
  if (search) {
    items = items.filter(
      (e) =>
        e.name.toLowerCase().includes(search) ||
        e.displayName.toLowerCase().includes(search),
    );
  }

  items.sort((a, b) => a.displayName.localeCompare(b.displayName));

  res.json(paginate(items, page, pageSize));
});

export default router;
