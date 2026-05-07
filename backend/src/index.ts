import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

dotenv.config();

import auditRouter from "./routes/admin/audit";
import authRouter from "./routes/admin/auth";
import dashboardRouter from "./routes/admin/dashboard";
import titlesRouter from "./routes/admin/titles";
import publicRouter from "./routes/public";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Public endpoints
app.use("/api", publicRouter);

// Auth
app.use("/api/auth", authRouter);

// Protected admin endpoints
app.use("/api/admin/dashboard", dashboardRouter);
app.use("/api/admin/titles", titlesRouter);
app.use("/api/admin/audit", auditRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date() }));

const PORT = parseInt(process.env.PORT || "3001", 10);
app.listen(PORT, () => {
  console.log(`CLIS Nigeria API running on http://localhost:${PORT}`);
});
