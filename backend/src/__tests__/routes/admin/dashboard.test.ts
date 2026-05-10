import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../db/models/Title", () => ({
  Title: { countDocuments: vi.fn(), aggregate: vi.fn() },
}));
vi.mock("../../../db/models/AuditLog", () => ({
  AuditLog: { aggregate: vi.fn() },
}));

import { AuditLog } from "../../../db/models/AuditLog";
import { Title } from "../../../db/models/Title";
import dashboardRouter from "../../../routes/admin/dashboard";

const app = express();
app.use(express.json());
app.use("/api/admin/dashboard", dashboardRouter);

const JWT_SECRET = process.env.JWT_SECRET!;
const FAKE_ID = "507f1f77bcf86cd799439011";

function authHeader(role: "registrar" | "admin" = "registrar") {
  return `Bearer ${jwt.sign({ userId: FAKE_ID, userCode: "USR-LSR-0241", role, jurisdictionState: "Lagos" }, JWT_SECRET)}`;
}

describe("GET /api/admin/dashboard/stats", () => {
  beforeEach(() => vi.mocked(Title.countDocuments).mockReset());

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/admin/dashboard/stats");
    expect(res.status).toBe(401);
  });

  it("returns numeric stats", async () => {
    vi.mocked(Title.countDocuments)
      .mockResolvedValueOnce(2400000 as any)
      .mockResolvedValueOnce(138 as any)
      .mockResolvedValueOnce(7 as any)
      .mockResolvedValueOnce(3 as any);

    const res = await request(app)
      .get("/api/admin/dashboard/stats")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.totalTitles).toBe(2400000);
    expect(res.body.titlesThisMonth).toBe(138);
    expect(res.body.activeDisputes).toBe(7);
    expect(res.body.pendingReviews).toBe(3);
  });

  it("returns 500 on DB error", async () => {
    vi.mocked(Title.countDocuments).mockRejectedValueOnce(new Error("db down"));
    const res = await request(app)
      .get("/api/admin/dashboard/stats")
      .set("Authorization", authHeader());
    expect(res.status).toBe(500);
  });
});

describe("GET /api/admin/dashboard/recent", () => {
  beforeEach(() => vi.mocked(AuditLog.aggregate).mockReset());

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/admin/dashboard/recent");
    expect(res.status).toBe(401);
  });

  it("returns an array of recent activity entries", async () => {
    const entries = [
      {
        timestamp: "2026-05-06T08:00:00Z",
        userCode: "USR-LSR-0241",
        operation: "INSERT",
        recordRef: "LAGOS-2026-04193",
        jurisdictionState: "Lagos",
        lga: "Yaba",
        status: "registered",
      },
    ];
    vi.mocked(AuditLog.aggregate).mockResolvedValueOnce(entries as any);
    const res = await request(app)
      .get("/api/admin/dashboard/recent")
      .set("Authorization", authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].operation).toBe("INSERT");
  });

  it("returns empty array when no activity", async () => {
    vi.mocked(AuditLog.aggregate).mockResolvedValueOnce([] as any);
    const res = await request(app)
      .get("/api/admin/dashboard/recent")
      .set("Authorization", authHeader());
    expect(res.body).toEqual([]);
  });
});

describe("GET /api/admin/dashboard/chart", () => {
  beforeEach(() => vi.mocked(Title.aggregate).mockReset());

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/admin/dashboard/chart");
    expect(res.status).toBe(401);
  });

  it("returns daily counts array", async () => {
    vi.mocked(Title.aggregate).mockResolvedValueOnce([
      { day: "2026-05-01", count: 42 },
      { day: "2026-05-02", count: 58 },
    ] as any);
    const res = await request(app)
      .get("/api/admin/dashboard/chart")
      .set("Authorization", authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty("day");
    expect(res.body[0]).toHaveProperty("count");
  });
});
