import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import verifyRouter from "./routes/verify";
import batchRouter from "./routes/batch";
import { getProvider } from "./providers/index";

const app = express();

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : ["http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/ai/health", async (_req, res) => {
  try {
    const health = await getProvider().healthCheck();
    res.json(health);
  } catch {
    res.status(500).json({
      provider: "unknown",
      configured: false,
      available: false,
      mode: "real",
      message: "Provider health check failed",
    });
  }
});

app.use("/api/verify", verifyRouter);
app.use("/api/batch", batchRouter);

app.use(errorHandler);

export default app;
