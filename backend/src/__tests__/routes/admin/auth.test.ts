import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../db", () => ({ pool: { query: vi.fn() } }));
vi.mock("bcryptjs", () => ({ default: { compare: vi.fn(), hash: vi.fn() } }));
vi.mock("otplib", () => ({
  authenticator: { verify: vi.fn(), generateSecret: vi.fn() },
}));

import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { pool } from "../../../db";
import authRouter from "../../../routes/admin/auth";

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);

const mockQuery = vi.mocked(
  pool.query as (...a: unknown[]) => Promise<unknown>,
);
const mockCompare = vi.mocked(bcrypt.compare);
const mockVerify = vi.mocked(authenticator.verify);

const TEMP_SECRET = process.env.JWT_TEMP_SECRET!;
const JWT_SECRET = process.env.JWT_SECRET!;

const FAKE_USER = {
  id: 1,
  email: "a.bello@lagosstate.gov.ng",
  name: "Aisha Bello",
  password_hash: "$2b$12$hashedpw",
  role: "registrar",
  user_code: "USR-LSR-0241",
  jurisdiction_state: "Lagos",
  mfa_secret: "BASE32TOTPSECRET",
};

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockCompare.mockReset();
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "pw" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Email and password required/);
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com" });
    expect(res.status).toBe(400);
  });

  it("returns 401 when user is not found in DB", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@gov.ng", password: "pw" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("returns 401 when password does not match", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [FAKE_USER] });
    mockCompare.mockResolvedValueOnce(false as never);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: FAKE_USER.email, password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("normalises email to lowercase before querying", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [FAKE_USER] });
    mockCompare.mockResolvedValueOnce(true as never);
    await request(app)
      .post("/api/auth/login")
      .send({ email: "A.BELLO@LAGOSSTATE.GOV.NG", password: "pw" });
    const calledWith = mockQuery.mock.calls[0][1];
    expect((calledWith as string[])[0]).toBe("a.bello@lagosstate.gov.ng");
  });

  it("returns tempToken and user info on success", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [FAKE_USER] });
    mockCompare.mockResolvedValueOnce(true as never);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: FAKE_USER.email, password: "Password123!" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("tempToken");
    expect(res.body.name).toBe("Aisha Bello");
    expect(res.body.email).toBe(FAKE_USER.email);
  });

  it("tempToken contains userId and step=mfa", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [FAKE_USER] });
    mockCompare.mockResolvedValueOnce(true as never);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: FAKE_USER.email, password: "pw" });
    const decoded = jwt.verify(res.body.tempToken, TEMP_SECRET) as {
      userId: number;
      step: string;
    };
    expect(decoded.userId).toBe(1);
    expect(decoded.step).toBe("mfa");
  });

  it("returns 500 on DB error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("db fail"));
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: FAKE_USER.email, password: "pw" });
    expect(res.status).toBe(500);
  });
});

describe("POST /api/auth/mfa", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockVerify.mockReset();
  });

  function makeTempToken(payload: object = { userId: 1, step: "mfa" }) {
    return jwt.sign(payload, TEMP_SECRET, { expiresIn: "5m" });
  }

  it("returns 400 when tempToken is missing", async () => {
    const res = await request(app)
      .post("/api/auth/mfa")
      .send({ code: "123456" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when code is missing", async () => {
    const res = await request(app)
      .post("/api/auth/mfa")
      .send({ tempToken: "tok" });
    expect(res.status).toBe(400);
  });

  it("returns 401 for an invalid tempToken", async () => {
    const res = await request(app)
      .post("/api/auth/mfa")
      .send({ tempToken: "bad.token", code: "123456" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid or expired temp token/);
  });

  it("returns 401 when tempToken step is not mfa", async () => {
    const token = jwt.sign({ userId: 1, step: "other" }, TEMP_SECRET);
    const res = await request(app)
      .post("/api/auth/mfa")
      .send({ tempToken: token, code: "123456" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid token step/);
  });

  it("returns 401 when user is not found after token decode", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const token = makeTempToken();
    const res = await request(app)
      .post("/api/auth/mfa")
      .send({ tempToken: token, code: "123456" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("User not found");
  });

  it("returns 401 when TOTP code is invalid", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [FAKE_USER] });
    mockVerify.mockReturnValueOnce(false);
    const token = makeTempToken();
    const res = await request(app)
      .post("/api/auth/mfa")
      .send({ tempToken: token, code: "000000" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid TOTP code");
  });

  it("strips spaces from the TOTP code before verifying", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [FAKE_USER] });
    mockVerify.mockReturnValueOnce(true);
    const token = makeTempToken();
    await request(app)
      .post("/api/auth/mfa")
      .send({ tempToken: token, code: "123 456" });
    expect(mockVerify).toHaveBeenCalledWith({
      token: "123456",
      secret: FAKE_USER.mfa_secret,
    });
  });

  it("returns accessToken and full user on success", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [FAKE_USER] });
    mockVerify.mockReturnValueOnce(true);
    const token = makeTempToken();
    const res = await request(app)
      .post("/api/auth/mfa")
      .send({ tempToken: token, code: "123456" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user.email).toBe(FAKE_USER.email);
    expect(res.body.user.role).toBe("registrar");
    expect(res.body.user).not.toHaveProperty("password_hash");
  });

  it("accessToken carries correct role claim", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [FAKE_USER] });
    mockVerify.mockReturnValueOnce(true);
    const token = makeTempToken();
    const res = await request(app)
      .post("/api/auth/mfa")
      .send({ tempToken: token, code: "123456" });
    const decoded = jwt.verify(res.body.accessToken, JWT_SECRET) as {
      role: string;
    };
    expect(decoded.role).toBe("registrar");
  });
});

describe("POST /api/auth/logout", () => {
  it("returns ok:true", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
