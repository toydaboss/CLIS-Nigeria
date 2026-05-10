import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../db/models/Title", () => ({
  Title: {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    updateOne: vi.fn(),
    countDocuments: vi.fn(),
  },
}));
vi.mock("../../../db/models/AuditLog", () => ({
  AuditLog: { create: vi.fn() },
}));

import { AuditLog } from "../../../db/models/AuditLog";
import { Title } from "../../../db/models/Title";
import titlesRouter from "../../../routes/admin/titles";

const app = express();
app.use(express.json());
app.use("/api/admin/titles", titlesRouter);

const JWT_SECRET = process.env.JWT_SECRET!;
const FAKE_ID = "507f1f77bcf86cd799439011";

function makeAuthHeader(role: "registrar" | "admin" = "registrar") {
  const token = jwt.sign(
    {
      userId: FAKE_ID,
      userCode: "USR-LSR-0241",
      role,
      jurisdictionState: "Lagos",
    },
    JWT_SECRET,
  );
  return `Bearer ${token}`;
}

function leanOf(value: unknown) {
  return { lean: vi.fn().mockResolvedValueOnce(value) } as any;
}

function chainOf(value: unknown) {
  const q: any = {
    sort: vi.fn(),
    skip: vi.fn(),
    limit: vi.fn(),
    select: vi.fn(),
    lean: vi.fn(),
  };
  q.sort.mockReturnValue(q);
  q.skip.mockReturnValue(q);
  q.limit.mockReturnValue(q);
  q.select.mockReturnValue(q);
  q.lean.mockResolvedValueOnce(value);
  return q;
}

const SAMPLE_TITLE = {
  _id: FAKE_ID,
  titleRef: "LAGOS-2024-00142",
  jurisdictionState: "Lagos",
  lga: "Ikoyi",
  registrationDate: new Date("2024-03-14"),
  status: "registered",
  registeredBy: "USR-LSR-0241",
  ownerNinLast4: "1234",
  ownerNameMasked: "ADE•••••• ••••••",
  latitude: 6.4527,
  longitude: 3.4327,
  documentRef: "LSR/IKY/2024/A-00142",
  disputeCase: null,
};

describe("GET /api/admin/titles/:ref", () => {
  beforeEach(() => vi.mocked(Title.findOne).mockReset());

  it("returns 401 without Authorization header", async () => {
    const res = await request(app).get("/api/admin/titles/LAGOS-2024-00142");
    expect(res.status).toBe(401);
  });

  it("returns found:false when title does not exist", async () => {
    vi.mocked(Title.findOne).mockReturnValueOnce(leanOf(null));
    const res = await request(app)
      .get("/api/admin/titles/LAGOS-2024-00000")
      .set("Authorization", makeAuthHeader());
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(false);
    expect(res.body.searched).toBe("LAGOS-2024-00000");
  });

  it("returns full title record including sensitive fields", async () => {
    vi.mocked(Title.findOne).mockReturnValueOnce(leanOf(SAMPLE_TITLE));
    const res = await request(app)
      .get("/api/admin/titles/LAGOS-2024-00142")
      .set("Authorization", makeAuthHeader());
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.title.ownerNinLast4).toBe("1234");
    expect(res.body.title.documentRef).toBeDefined();
  });

  it("uppercases the ref", async () => {
    vi.mocked(Title.findOne).mockReturnValueOnce(leanOf(null));
    await request(app)
      .get("/api/admin/titles/lagos-2024-00142")
      .set("Authorization", makeAuthHeader());
    expect(Title.findOne).toHaveBeenCalledWith({
      titleRef: "LAGOS-2024-00142",
    });
  });
});

describe("POST /api/admin/titles", () => {
  beforeEach(() => {
    vi.mocked(Title.find).mockReset();
    vi.mocked(Title.create).mockReset();
    vi.mocked(AuditLog.create).mockReset();
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
      .send({ ownerNinLast4: "1234" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/);
  });

  it("registers a title successfully and returns 201", async () => {
    vi.mocked(Title.find).mockReturnValueOnce(chainOf([]));
    vi.mocked(Title.create).mockResolvedValueOnce(SAMPLE_TITLE as any);
    vi.mocked(AuditLog.create).mockResolvedValueOnce({} as any);

    const res = await request(app)
      .post("/api/admin/titles")
      .set("Authorization", makeAuthHeader())
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("nearby");
  });

  it("returns nearby refs when overlap is detected", async () => {
    vi.mocked(Title.find).mockReturnValueOnce(
      chainOf([{ titleRef: "LAGOS-2024-00142" }]),
    );
    vi.mocked(Title.create).mockResolvedValueOnce(SAMPLE_TITLE as any);
    vi.mocked(AuditLog.create).mockResolvedValueOnce({} as any);

    const res = await request(app)
      .post("/api/admin/titles")
      .set("Authorization", makeAuthHeader())
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.nearby).toContain("LAGOS-2024-00142");
  });

  it("returns 409 on duplicate titleRef", async () => {
    vi.mocked(Title.find).mockReturnValueOnce(chainOf([]));
    vi.mocked(Title.create).mockRejectedValueOnce(
      Object.assign(new Error("dup"), { code: 11000 }),
    );

    const res = await request(app)
      .post("/api/admin/titles")
      .set("Authorization", makeAuthHeader())
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/);
  });

  it("returns 500 on unexpected DB error", async () => {
    vi.mocked(Title.find).mockReturnValueOnce(chainOf([]));
    vi.mocked(Title.create).mockRejectedValueOnce(new Error("insert failed"));

    const res = await request(app)
      .post("/api/admin/titles")
      .set("Authorization", makeAuthHeader())
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/admin/titles/:ref/dispute", () => {
  beforeEach(() => {
    vi.mocked(Title.findOne).mockReset();
    vi.mocked(Title.updateOne).mockReset();
    vi.mocked(AuditLog.create).mockReset();
  });

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .patch("/api/admin/titles/LAGOS-2024-00142/dispute")
      .send({ disputeCase: "DSP-1" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when title does not exist", async () => {
    vi.mocked(Title.findOne).mockReturnValueOnce(leanOf(null));
    const res = await request(app)
      .patch("/api/admin/titles/LAGOS-2024-99999/dispute")
      .set("Authorization", makeAuthHeader())
      .send({ disputeCase: "DSP-999" });
    expect(res.status).toBe(404);
  });

  it("flags a dispute and returns ok:true", async () => {
    vi.mocked(Title.findOne).mockReturnValueOnce(
      leanOf({ status: "registered" }),
    );
    vi.mocked(Title.updateOne).mockResolvedValueOnce({} as any);
    vi.mocked(AuditLog.create).mockResolvedValueOnce({} as any);

    const res = await request(app)
      .patch("/api/admin/titles/LAGOS-2024-00142/dispute")
      .set("Authorization", makeAuthHeader())
      .send({ disputeCase: "DSP-2026-0001" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe("GET /api/admin/titles (list)", () => {
  beforeEach(() => {
    vi.mocked(Title.find).mockReset();
    vi.mocked(Title.countDocuments).mockReset();
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/admin/titles");
    expect(res.status).toBe(401);
  });

  it("returns paginated list with default limit 20", async () => {
    vi.mocked(Title.find).mockReturnValueOnce(chainOf([SAMPLE_TITLE]));
    vi.mocked(Title.countDocuments).mockResolvedValueOnce(42 as any);

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
    vi.mocked(Title.find).mockReturnValueOnce(chainOf([]));
    vi.mocked(Title.countDocuments).mockResolvedValueOnce(100 as any);

    const res = await request(app)
      .get("/api/admin/titles?limit=10&offset=30")
      .set("Authorization", makeAuthHeader());

    expect(res.body.limit).toBe(10);
    expect(res.body.offset).toBe(30);
  });

  it("caps limit at 100", async () => {
    vi.mocked(Title.find).mockReturnValueOnce(chainOf([]));
    vi.mocked(Title.countDocuments).mockResolvedValueOnce(0 as any);

    const res = await request(app)
      .get("/api/admin/titles?limit=999")
      .set("Authorization", makeAuthHeader());

    expect(res.body.limit).toBe(100);
  });
});
