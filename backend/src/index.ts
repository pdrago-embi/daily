import "dotenv/config";
import express from "express";
import cors from "cors";
import metricsRouter from "./routes/metrics.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", metricsRouter);

app.listen(PORT, () => {
  console.log(`Embi metrics proxy listening on http://localhost:${PORT}`);
});
