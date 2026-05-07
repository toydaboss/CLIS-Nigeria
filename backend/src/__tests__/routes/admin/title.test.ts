import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../db", () => ({ pool: { query: vi.fn(), connect: vi.fn() } }));

import { pool } from "../../../db";
import titlesRouter from "../../../routes/admin/titles";

const app = express();
app.use(express.json());
app.use("/api/admin/titles", titlesRouter);

const mockQuery = vi.mocked(
  pool.query as (...a: unknown[]) => Promise<unknown>,
);
const mockConnect = vi.mocked(pool.connect as () => Promise<unknown>);

const JWT_SECRET = process.env.JWT_SECRET!;

function makeAuthHeader(role: "registrar" | "admin" = "registrar") {
  const token = jwt.sign(
    { userId: 1, userCode: "USR-LSR-0241", role, jurisdictionState: "Lagos" },
    JWT_SECRET,
  );
  return `Bearer ${token}`;
}

// Build a mock transaction client
function makeMockClient(queryResults: Array<{ rows: unknown[] }>) {
  let callIndex = 0;
  const mockClient = {
    query: vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(queryResults[callIndex++] ?? { rows: [] }),
      ),
    release: vi.fn(),
  };
  return mockClient;
}

const SAMPLE_TITLE = {
  title_ref: "LAGOS-2024-00142",
  jurisdiction_state: "Lagos",
  lga: "Ikoyi",
  registration_date: "2024-03-14",
  status: "registered",
  registered_by: "USR-LSR-0241",
  owner_nin_last4: "1234",
  owner_name_masked: "ADE•••••• ••••••",
  latitude: "6.4527",
  longitude: "3.4327",
  document_ref: "LSR/IKY/2024/A-00142",
  dispute_case: null,
  last_modified: "2024-03-14T10:00:00Z",
};

describe("GET /api/admin/titles/:ref", () => {
  beforeEach(() => mockQuery.mockReset());

  it("returns 401 without Authorization header", async () => {
    const res = await request(app).get("/api/admin/titles/LAGOS-2024-00142");
    expect(res.status).toBe(401);
  });

  it("returns found:false when title does not exist", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .get("/api/admin/titles/LAGOS-2024-00000")
      .set("Authorization", makeAuthHeader());
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(false);
    expect(res.body.searched).toBe("LAGOS-2024-00000");
  });

  it("returns full title record including sensitive fields", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [SAMPLE_TITLE] });
    const res = await request(app)
      .get("/api/admin/titles/LAGOS-2024-00142")
      .set("Authorization", makeAuthHeader());
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.title.owner_nin_last4).toBe("1234");
    expect(res.body.title.document_ref).toBeDefined();
  });

  it("uppercases the ref", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await request(app)
      .get("/api/admin/titles/lagos-2024-00142")
      .set("Authorization", makeAuthHeader());
    const calledWith = mockQuery.mock.calls[0][1];
    expect((calledWith as string[])[0]).toBe("LAGOS-2024-00142");
  });
});

describe("POST /api/admin/titles", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockConnect.mockReset();
  });

  const VALID_PAYLOAD = {
    titleRef: "LAGOS-2026-05000",
    ownerNinLast4: "1234",
    ownerNameMasked: "ADE•••••• ••••••",
    jurisdictionState: "Lagos",
    lga: "Ikeja",
    latitude: 6.5244,
    longitude: 3.3792,
    documentRef: "LSR/IKJ/2026/A-05000",
    registrationDate: "2026-05-06",
  };

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .post("/api/admin/titles")
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/admin/titles")
      .set("Authorization", makeAuthHeader())
      .send({ ownerNinLast4: "1234" }); // missing titleRef, jurisdictionState, registrationDate
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/);
  });

  it("registers a title successfully and returns 201", async () => {
    // Pool query for nearby check
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // Pool connect for transaction
    const client = makeMockClient([
      { rows: [] }, // BEGIN
      { rows: [SAMPLE_TITLE] }, // INSERT INTO titles
      { rows: [] }, // INSERT INTO audit_log
      { rows: [] }, // COMMIT
    ]);
    mockConnect.mockResolvedValueOnce(client as never);

    const res = await request(app)
      .post("/api/admin/titles")
      .set("Authorization", makeAuthHeader())
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("nearby");
    expect(client.release).toHaveBeenCalled();
  });

  it("returns nearby refs when overlap is detected", async () => {
    // Pool query for nearby check — returns one nearby title
    mockQuery.mockResolvedValueOnce({
      rows: [{ title_ref: "LAGOS-2024-00142" }],
    });
    const client = makeMockClient([
      { rows: [] },
      { rows: [SAMPLE_TITLE] },
      { rows: [] },
      { rows: [] },
    ]);
    mockConnect.mockResolvedValueOnce(client as never);

    const res = await request(app)
      .post("/api/admin/titles")
      .set("Authorization", makeAuthHeader())
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.nearby).toContain("LAGOS-2024-00142");
  });

  it("returns 409 on duplicate title_ref (unique constraint)", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const duplicateError = Object.assign(new Error("duplicate"), {
      code: "23505",
    });
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(duplicateError), // INSERT throws
      release: vi.fn(),
    };
    mockConnect.mockResolvedValueOnce(client as never);

    const res = await request(app)
      .post("/api/admin/titles")
      .set("Authorization", makeAuthHeader())
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/);
    expect(client.release).toHaveBeenCalled();
  });

  it("rolls back transaction and releases client on DB error", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error("insert failed")), // INSERT
      release: vi.fn(),
    };
    mockConnect.mockResolvedValueOnce(client as never);

    await request(app)
      .post("/api/admin/titles")
      .set("Authorization", makeAuthHeader())
      .send(VALID_PAYLOAD);

    const calls = (client.query as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => c[0] as string,
    );
    expect(calls.some((q) => q.includes("ROLLBACK"))).toBe(true);
    expect(client.release).toHaveBeenCalled();
  });
});

describe("PATCH /api/admin/titles/:ref/dispute", () => {
  beforeEach(() => {
    mockConnect.mockReset();
  });

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .patch("/api/admin/titles/LAGOS-2024-00142/dispute")
      .send({ disputeCase: "DSP-1" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when title does not exist", async () => {
    const client = makeMockClient([
      { rows: [] }, // BEGIN
      { rows: [] }, // SELECT — not found
    ]);
    mockConnect.mockResolvedValueOnce(client as never);

    const res = await request(app)
      .patch("/api/admin/titles/LAGOS-2024-99999/dispute")
      .set("Authorization", makeAuthHeader())
      .send({ disputeCase: "DSP-999" });

    expect(res.status).toBe(404);
    expect(client.release).toHaveBeenCalled();
  });

  it("flags a dispute and returns ok:true", async () => {
    const client = makeMockClient([
      { rows: [] }, // BEGIN
      { rows: [{ status: "registered" }] }, // SELECT existing
      { rows: [] }, // UPDATE
      { rows: [] }, // INSERT audit_log
      { rows: [] }, // COMMIT
    ]);
    mockConnect.mockResolvedValueOnce(client as never);

    const res = await request(app)
      .patch("/api/admin/titles/LAGOS-2024-00142/dispute")
      .set("Authorization", makeAuthHeader())
      .send({ disputeCase: "DSP-2026-0001" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(client.release).toHaveBeenCalled();
  });
});

describe("GET /api/admin/titles (list)", () => {
  beforeEach(() => mockQuery.mockReset());

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/admin/titles");
    expect(res.status).toBe(401);
  });

  it("returns paginated list with default limit 20", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [SAMPLE_TITLE] })
      .mockResolvedValueOnce({ rows: [{ count: "42" }] });

    const res = await request(app)
      .get("/api/admin/titles")
      .set("Authorization", makeAuthHeader());

    expect(res.status).toBe(200);
    expect(res.body.titles).toHaveLength(1);
    expect(res.body.total).toBe(42);
    expect(res.body.limit).toBe(20);
    expect(res.body.offset).toBe(0);
  });

  it("respects offset and limit query params", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "100" }] });

    const res = await request(app)
      .get("/api/admin/titles?limit=10&offset=30")
      .set("Authorization", makeAuthHeader());

    expect(res.body.limit).toBe(10);
    expect(res.body.offset).toBe(30);
  });

  it("caps limit at 100", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "0" }] });

    const res = await request(app)
      .get("/api/admin/titles?limit=999")
      .set("Authorization", makeAuthHeader());

    expect(res.body.limit).toBe(100);
  });
});
