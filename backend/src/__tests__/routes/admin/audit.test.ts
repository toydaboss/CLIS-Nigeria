import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../db", () => ({ pool: { query: vi.fn() } }));

import { pool } from "../../../db";
import auditRouter from "../../../routes/admin/audit";

const app = express();
app.use(express.json());
app.use("/api/admin/audit", auditRouter);

const mockQuery = vi.mocked(
  pool.query as (...a: unknown[]) => Promise<unknown>,
);
const JWT_SECRET = process.env.JWT_SECRET!;

function authHeader(role: "registrar" | "admin") {
  return `Bearer ${jwt.sign({ userId: 1, userCode: "USR-ADM-0001", role, jurisdictionState: null }, JWT_SECRET)}`;
}

const SAMPLE_ENTRIES = [
  {
    id: 1,
    timestamp: "2026-05-05T08:42:17+01:00",
    user_code: "USR-LSR-0241",
    operation: "INSERT",
    record_ref: "LAGOS-2026-04193",
    before_state: null,
    after_state: { status: "REGISTERED" },
  },
  {
    id: 2,
    timestamp: "2026-05-05T08:24:08+01:00",
    user_code: "USR-LSR-0241",
    operation: "UPDATE",
    record_ref: "LAGOS-2026-04192",
    before_state: { status: "REGISTERED" },
    after_state: { status: "DISPUTED" },
  },
];

describe("GET /api/admin/audit — access control", () => {
  it("returns 401 with no auth token", async () => {
    const res = await request(app).get("/api/admin/audit");
    expect(res.status).toBe(401);
  });

  it("returns 403 for registrar role", async () => {
    const res = await request(app)
      .get("/api/admin/audit")
      .set("Authorization", authHeader("registrar"));
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Administrator/);
  });

  it("allows access for admin role", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: SAMPLE_ENTRIES })
      .mockResolvedValueOnce({ rows: [{ count: "2" }] });

    const res = await request(app)
      .get("/api/admin/audit")
      .set("Authorization", authHeader("admin"));

    expect(res.status).toBe(200);
  });
});

describe("GET /api/admin/audit — response shape", () => {
  beforeEach(() => mockQuery.mockReset());

  it("returns entries array, total, limit and offset", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: SAMPLE_ENTRIES })
      .mockResolvedValueOnce({ rows: [{ count: "150" }] });

    const res = await request(app)
      .get("/api/admin/audit")
      .set("Authorization", authHeader("admin"));

    expect(res.body.entries).toHaveLength(2);
    expect(res.body.total).toBe(150);
    expect(res.body.limit).toBe(25);
    expect(res.body.offset).toBe(0);
  });

  it("entry has required fields", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [SAMPLE_ENTRIES[0]] })
      .mockResolvedValueOnce({ rows: [{ count: "1" }] });

    const res = await request(app)
      .get("/api/admin/audit")
      .set("Authorization", authHeader("admin"));

    const entry = res.body.entries[0];
    expect(entry).toHaveProperty("id");
    expect(entry).toHaveProperty("timestamp");
    expect(entry).toHaveProperty("user_code");
    expect(entry).toHaveProperty("operation");
    expect(entry).toHaveProperty("record_ref");
    expect(entry).toHaveProperty("before_state");
    expect(entry).toHaveProperty("after_state");
  });

  it("preserves null before_state for INSERT operations", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [SAMPLE_ENTRIES[0]] })
      .mockResolvedValueOnce({ rows: [{ count: "1" }] });

    const res = await request(app)
      .get("/api/admin/audit")
      .set("Authorization", authHeader("admin"));

    expect(res.body.entries[0].before_state).toBeNull();
  });
});

describe("GET /api/admin/audit — pagination", () => {
  beforeEach(() => mockQuery.mockReset());

  it("respects limit and offset params", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "200" }] });

    const res = await request(app)
      .get("/api/admin/audit?limit=10&offset=50")
      .set("Authorization", authHeader("admin"));

    expect(res.body.limit).toBe(10);
    expect(res.body.offset).toBe(50);
  });

  it("caps limit at 100", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "0" }] });

    const res = await request(app)
      .get("/api/admin/audit?limit=500")
      .set("Authorization", authHeader("admin"));

    expect(res.body.limit).toBe(100);
  });

  it("returns empty entries array when none match", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "0" }] });

    const res = await request(app)
      .get("/api/admin/audit")
      .set("Authorization", authHeader("admin"));

    expect(res.body.entries).toEqual([]);
    expect(res.body.total).toBe(0);
  });
});

describe("GET /api/admin/audit — error handling", () => {
  beforeEach(() => mockQuery.mockReset());

  it("returns 500 on DB error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("db failed"));

    const res = await request(app)
      .get("/api/admin/audit")
      .set("Authorization", authHeader("admin"));

    expect(res.status).toBe(500);
  });
});
