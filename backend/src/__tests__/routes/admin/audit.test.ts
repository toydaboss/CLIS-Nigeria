import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../db/models/AuditLog", () => ({
  AuditLog: { find: vi.fn(), countDocuments: vi.fn() },
}));

import { AuditLog } from "../../../db/models/AuditLog";
import auditRouter from "../../../routes/admin/audit";

const app = express();
app.use(express.json());
app.use("/api/admin/audit", auditRouter);

const JWT_SECRET = process.env.JWT_SECRET!;
const FAKE_ID = "507f1f77bcf86cd799439011";

function authHeader(role: "registrar" | "admin") {
  return `Bearer ${jwt.sign({ userId: FAKE_ID, userCode: "USR-ADM-0001", role, jurisdictionState: null }, JWT_SECRET)}`;
}

function chainOf(value: unknown) {
  const q: any = {
    sort: vi.fn(),
    skip: vi.fn(),
    limit: vi.fn(),
    lean: vi.fn(),
  };
  q.sort.mockReturnValue(q);
  q.skip.mockReturnValue(q);
  q.limit.mockReturnValue(q);
  q.lean.mockResolvedValueOnce(value);
  return q;
}

const SAMPLE_ENTRIES = [
  {
    _id: "1",
    timestamp: "2026-05-05T08:42:17+01:00",
    userCode: "USR-LSR-0241",
    operation: "INSERT",
    recordRef: "LAGOS-2026-04193",
    beforeState: null,
    afterState: { status: "REGISTERED" },
  },
  {
    _id: "2",
    timestamp: "2026-05-05T08:24:08+01:00",
    userCode: "USR-LSR-0241",
    operation: "UPDATE",
    recordRef: "LAGOS-2026-04192",
    beforeState: { status: "REGISTERED" },
    afterState: { status: "DISPUTED" },
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
    vi.mocked(AuditLog.find).mockReturnValueOnce(chainOf(SAMPLE_ENTRIES));
    vi.mocked(AuditLog.countDocuments).mockResolvedValueOnce(2 as any);

    const res = await request(app)
      .get("/api/admin/audit")
      .set("Authorization", authHeader("admin"));

    expect(res.status).toBe(200);
  });
});

describe("GET /api/admin/audit — response shape", () => {
  beforeEach(() => {
    vi.mocked(AuditLog.find).mockReset();
    vi.mocked(AuditLog.countDocuments).mockReset();
  });

  it("returns entries array, total, limit and offset", async () => {
    vi.mocked(AuditLog.find).mockReturnValueOnce(chainOf(SAMPLE_ENTRIES));
    vi.mocked(AuditLog.countDocuments).mockResolvedValueOnce(150 as any);

    const res = await request(app)
      .get("/api/admin/audit")
      .set("Authorization", authHeader("admin"));

    expect(res.body.entries).toHaveLength(2);
    expect(res.body.total).toBe(150);
    expect(res.body.limit).toBe(25);
    expect(res.body.offset).toBe(0);
  });

  it("entry has required fields", async () => {
    vi.mocked(AuditLog.find).mockReturnValueOnce(chainOf([SAMPLE_ENTRIES[0]]));
    vi.mocked(AuditLog.countDocuments).mockResolvedValueOnce(1 as any);

    const res = await request(app)
      .get("/api/admin/audit")
      .set("Authorization", authHeader("admin"));

    const entry = res.body.entries[0];
    expect(entry).toHaveProperty("timestamp");
    expect(entry).toHaveProperty("userCode");
    expect(entry).toHaveProperty("operation");
    expect(entry).toHaveProperty("recordRef");
    expect(entry).toHaveProperty("beforeState");
    expect(entry).toHaveProperty("afterState");
  });

  it("preserves null beforeState for INSERT operations", async () => {
    vi.mocked(AuditLog.find).mockReturnValueOnce(chainOf([SAMPLE_ENTRIES[0]]));
    vi.mocked(AuditLog.countDocuments).mockResolvedValueOnce(1 as any);

    const res = await request(app)
      .get("/api/admin/audit")
      .set("Authorization", authHeader("admin"));

    expect(res.body.entries[0].beforeState).toBeNull();
  });
});

describe("GET /api/admin/audit — pagination", () => {
  beforeEach(() => {
    vi.mocked(AuditLog.find).mockReset();
    vi.mocked(AuditLog.countDocuments).mockReset();
  });

  it("respects limit and offset params", async () => {
    vi.mocked(AuditLog.find).mockReturnValueOnce(chainOf([]));
    vi.mocked(AuditLog.countDocuments).mockResolvedValueOnce(200 as any);

    const res = await request(app)
      .get("/api/admin/audit?limit=10&offset=50")
      .set("Authorization", authHeader("admin"));

    expect(res.body.limit).toBe(10);
    expect(res.body.offset).toBe(50);
  });

  it("caps limit at 100", async () => {
    vi.mocked(AuditLog.find).mockReturnValueOnce(chainOf([]));
    vi.mocked(AuditLog.countDocuments).mockResolvedValueOnce(0 as any);

    const res = await request(app)
      .get("/api/admin/audit?limit=500")
      .set("Authorization", authHeader("admin"));

    expect(res.body.limit).toBe(100);
  });

  it("returns empty entries array when none match", async () => {
    vi.mocked(AuditLog.find).mockReturnValueOnce(chainOf([]));
    vi.mocked(AuditLog.countDocuments).mockResolvedValueOnce(0 as any);

    const res = await request(app)
      .get("/api/admin/audit")
      .set("Authorization", authHeader("admin"));

    expect(res.body.entries).toEqual([]);
    expect(res.body.total).toBe(0);
  });
});

describe("GET /api/admin/audit — error handling", () => {
  beforeEach(() => vi.mocked(AuditLog.find).mockReset());

  it("returns 500 on DB error", async () => {
    vi.mocked(AuditLog.find).mockReturnValueOnce({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockRejectedValueOnce(new Error("db failed")),
    } as any);

    const res = await request(app)
      .get("/api/admin/audit")
      .set("Authorization", authHeader("admin"));

    expect(res.status).toBe(500);
  });
});
