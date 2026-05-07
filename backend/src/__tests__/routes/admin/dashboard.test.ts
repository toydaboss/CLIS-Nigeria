import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../db", () => ({ pool: { query: vi.fn() } }));

import { pool } from "../../../db";
import dashboardRouter from "../../../routes/admin/dashboard";

const app = express();
app.use(express.json());
app.use("/api/admin/dashboard", dashboardRouter);

const mockQuery = vi.mocked(
  pool.query as (...a: unknown[]) => Promise<unknown>,
);
const JWT_SECRET = process.env.JWT_SECRET!;

function authHeader(role: "registrar" | "admin" = "registrar") {
  return `Bearer ${jwt.sign({ userId: 1, userCode: "USR-LSR-0241", role, jurisdictionState: "Lagos" }, JWT_SECRET)}`;
}

describe("GET /api/admin/dashboard/stats", () => {
  beforeEach(() => mockQuery.mockReset());

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/admin/dashboard/stats");
    expect(res.status).toBe(401);
  });

  it("returns parsed integer stats", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          total_titles: "2400000",
          titles_this_month: "138",
          active_disputes: "7",
          pending_reviews: "3",
        },
      ],
    });

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
    mockQuery.mockRejectedValueOnce(new Error("db down"));
    const res = await request(app)
      .get("/api/admin/dashboard/stats")
      .set("Authorization", authHeader());
    expect(res.status).toBe(500);
  });
});

describe("GET /api/admin/dashboard/recent", () => {
  beforeEach(() => mockQuery.mockReset());

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/admin/dashboard/recent");
    expect(res.status).toBe(401);
  });

  it("returns an array of recent activity rows", async () => {
    const rows = [
      {
        timestamp: "2026-05-06T08:00:00Z",
        user_code: "USR-LSR-0241",
        operation: "INSERT",
        record_ref: "LAGOS-2026-04193",
        jurisdiction_state: "Lagos",
        lga: "Yaba",
        status: "registered",
      },
    ];
    mockQuery.mockResolvedValueOnce({ rows });
    const res = await request(app)
      .get("/api/admin/dashboard/recent")
      .set("Authorization", authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].operation).toBe("INSERT");
  });

  it("returns empty array when no activity", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .get("/api/admin/dashboard/recent")
      .set("Authorization", authHeader());
    expect(res.body).toEqual([]);
  });
});

describe("GET /api/admin/dashboard/chart", () => {
  beforeEach(() => mockQuery.mockReset());

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/admin/dashboard/chart");
    expect(res.status).toBe(401);
  });

  it("returns daily counts array", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { day: "2026-05-01", count: "42" },
        { day: "2026-05-02", count: "58" },
      ],
    });
    const res = await request(app)
      .get("/api/admin/dashboard/chart")
      .set("Authorization", authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty("day");
    expect(res.body[0]).toHaveProperty("count");
  });
});
