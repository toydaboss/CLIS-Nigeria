import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db/models/Title", () => ({
  Title: { findOne: vi.fn() },
}));

import { Title } from "../../db/models/Title";
import publicRouter from "../../routes/public";

const app = express();
app.use(express.json());
app.use("/api", publicRouter);

const mockFindOne = vi.mocked(Title.findOne);

const REGISTERED_DOC = {
  titleRef: "LAGOS-2024-00142",
  jurisdictionState: "Lagos",
  registrationDate: new Date("2024-03-14"),
  status: "registered",
  disputeCase: null,
};

const DISPUTED_DOC = {
  ...REGISTERED_DOC,
  titleRef: "ABUJA-2022-08891",
  jurisdictionState: "FCT Abuja",
  status: "disputed",
  disputeCase: "DSP-2026-0418",
};

describe("GET /api/titles/:ref — format validation", () => {
  it("returns 400 for completely invalid format", async () => {
    const res = await request(app).get("/api/titles/not-a-ref");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid title reference format/);
  });

  it("returns 400 when year part is missing", async () => {
    const res = await request(app).get("/api/titles/LAGOS-00142");
    expect(res.status).toBe(400);
  });

  it("returns 400 when sequence is too short", async () => {
    const res = await request(app).get("/api/titles/LAGOS-2024-1234");
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty ref", async () => {
    const res = await request(app).get("/api/titles/%20");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/titles/:ref — DB responses", () => {
  beforeEach(() => {
    mockFindOne.mockReset();
  });

  it("returns found:false when title does not exist", async () => {
    mockFindOne.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValueOnce(null),
    } as any);
    const res = await request(app).get("/api/titles/LAGOS-2024-00000");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ found: false, searched: "LAGOS-2024-00000" });
  });

  it("returns title data for a registered title", async () => {
    mockFindOne.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValueOnce(REGISTERED_DOC),
    } as any);
    const res = await request(app).get("/api/titles/LAGOS-2024-00142");
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.titleRef).toBe("LAGOS-2024-00142");
    expect(res.body.status).toBe("registered");
    expect(res.body.disputeCase).toBeNull();
    expect(res.body).toHaveProperty("lastVerified");
  });

  it("returns dispute case for a disputed title", async () => {
    mockFindOne.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValueOnce(DISPUTED_DOC),
    } as any);
    const res = await request(app).get("/api/titles/ABUJA-2022-08891");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("disputed");
    expect(res.body.disputeCase).toBe("DSP-2026-0418");
  });

  it("uppercases the ref before querying", async () => {
    mockFindOne.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValueOnce(REGISTERED_DOC),
    } as any);
    await request(app).get("/api/titles/lagos-2024-00142");
    expect(mockFindOne).toHaveBeenCalledWith({ titleRef: "LAGOS-2024-00142" });
  });

  it("returns 500 on unexpected DB error", async () => {
    mockFindOne.mockReturnValueOnce({
      lean: vi.fn().mockRejectedValueOnce(new Error("connection lost")),
    } as any);
    const res = await request(app).get("/api/titles/LAGOS-2024-00142");
    expect(res.status).toBe(500);
  });

  it("multi-word state ref (FCT format) passes validation", async () => {
    mockFindOne.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValueOnce(null),
    } as any);
    const res = await request(app).get("/api/titles/FCT-2022-08891");
    expect(res.status).toBe(200);
  });
});
