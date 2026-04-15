import express from "express";
import cors from "cors";
import journeysRouter from "./routes/journeys";
import eventsRouter from "./routes/events";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/api/journeys", journeysRouter);
app.use("/api/events", eventsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log("");
  console.log("  ╔═══════════════════════════════════════════╗");
  console.log("  ║   Ripple API Stub Server                  ║");
  console.log(`  ║   http://localhost:${PORT}                    ║`);
  console.log("  ╠═══════════════════════════════════════════╣");
  console.log("  ║  Routes:                                  ║");
  console.log("  ║   GET    /api/journeys                    ║");
  console.log("  ║   GET    /api/journeys/:id                ║");
  console.log("  ║   POST   /api/journeys                    ║");
  console.log("  ║   PUT    /api/journeys/:id                ║");
  console.log("  ║   DELETE /api/journeys/:id                ║");
  console.log("  ║   GET    /api/events                      ║");
  console.log("  ║   GET    /api/health                      ║");
  console.log("  ╠═══════════════════════════════════════════╣");
  console.log("  ║  CORS: http://localhost:5173              ║");
  console.log("  ║  Store: in-memory (resets on restart)     ║");
  console.log("  ╚═══════════════════════════════════════════╝");
  console.log("");
});
