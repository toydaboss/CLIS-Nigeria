import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

dotenv.config();

import { connectDB } from "./db";
import auditRouter from "./routes/admin/audit";
import authRouter from "./routes/admin/auth";
import dashboardRouter from "./routes/admin/dashboard";
import jurisdictionsRouter from "./routes/admin/jurisdictions";
import titlesRouter from "./routes/admin/titles";
import usersRouter from "./routes/admin/users";
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

app.use("/api", publicRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin/dashboard", dashboardRouter);
app.use("/api/admin/titles", titlesRouter);
app.use("/api/admin/audit", auditRouter);
app.use("/api/admin/users", usersRouter);
app.use("/api/admin/jurisdictions", jurisdictionsRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date() }));

const PORT = parseInt(process.env.PORT || "3001", 10);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CLIS Nigeria API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
