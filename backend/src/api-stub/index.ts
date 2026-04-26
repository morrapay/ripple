import express from "express";
import cors from "cors";
import path from "path";
import journeysRouter from "./routes/journeys";
import eventsRouter from "./routes/events";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const isProd = process.env.NODE_ENV === "production";

// In production the frontend is served from the same origin,
// so CORS is a no-op. In dev, allow the Vite dev server.
app.use(
  cors({
    origin: isProd ? false : "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// ─── API routes ───────────────────────────────────────────────
app.use("/api/journeys", journeysRouter);
app.use("/api/events", eventsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ─── Serve frontend build in production ───────────────────────
// Resolve from cwd (repo root) so it works regardless of how tsx resolves __dirname
const FRONTEND_DIST = path.resolve(process.cwd(), "frontend/dist");

app.use(express.static(FRONTEND_DIST));

// SPA fallback: any non-API route serves index.html so React
// Router can handle client-side navigation.
// Express 5 requires named wildcard parameters.
app.get("/{*splat}", (_req, res, _next) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"), (err) => {
    if (err) {
      res.status(404).json({ code: "NOT_FOUND", message: "Not found" });
    }
  });
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  const base = isProd ? `port ${PORT}` : `http://localhost:${PORT}`;
  console.log("");
  console.log("  ╔═══════════════════════════════════════════╗");
  console.log(`  ║   Ripple ${isProd ? "Production" : "Dev"}`.padEnd(46) + "║");
  console.log(`  ║   ${base}`.padEnd(46) + "║");
  console.log("  ╠═══════════════════════════════════════════╣");
  console.log("  ║  API:                                     ║");
  console.log("  ║   GET    /api/journeys                    ║");
  console.log("  ║   GET    /api/journeys/:id                ║");
  console.log("  ║   POST   /api/journeys                    ║");
  console.log("  ║   PUT    /api/journeys/:id                ║");
  console.log("  ║   DELETE /api/journeys/:id                ║");
  console.log("  ║   GET    /api/events                      ║");
  console.log("  ║   GET    /api/health                      ║");
  if (isProd) {
    console.log("  ╠═══════════════════════════════════════════╣");
    console.log("  ║  Frontend: serving from frontend/dist     ║");
  }
  console.log("  ╚═══════════════════════════════════════════╝");
  console.log("");
});
