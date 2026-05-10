import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminOnly, auth } from "../../middleware/auth";

const SECRET = process.env.JWT_SECRET!;
const FAKE_ID = "507f1f77bcf86cd799439011";

function mockReq(authHeader?: string): Request {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as Request;
}

function mockRes() {
  const res = { status: vi.fn(), json: vi.fn() } as unknown as Response;
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return res;
}

function makeToken(
  payload: object,
  secret = SECRET,
  opts: jwt.SignOptions = {},
) {
  return jwt.sign(payload, secret, opts);
}

describe("auth middleware", () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    next = vi.fn();
  });

  it("returns 401 when Authorization header is absent", () => {
    auth(mockReq(), mockRes(), next);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when scheme is not Bearer", () => {
    const res = mockRes();
    auth(mockReq("Basic dXNlcjpwYXNz"), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for a malformed / unsigned token", () => {
    const res = mockRes();
    auth(mockReq("Bearer not.a.real.jwt"), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when token is signed with the wrong secret", () => {
    const token = makeToken(
      { userId: FAKE_ID, role: "registrar" },
      "wrong-secret",
    );
    const res = mockRes();
    auth(mockReq(`Bearer ${token}`), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when token is expired", () => {
    const token = makeToken({ userId: FAKE_ID, role: "registrar" }, SECRET, {
      expiresIn: -1,
    });
    const res = mockRes();
    auth(mockReq(`Bearer ${token}`), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("calls next() and sets req.user when token is valid", () => {
    const payload = {
      userId: FAKE_ID,
      userCode: "USR-LSR-0241",
      role: "registrar",
      jurisdictionState: "Lagos",
    };
    const req = mockReq(`Bearer ${makeToken(payload, SECRET)}`);
    auth(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject(payload);
  });

  it("populates req.user with all required fields", () => {
    const payload = {
      userId: FAKE_ID,
      userCode: "USR-ADM-0001",
      role: "admin",
      jurisdictionState: null,
    };
    const req = mockReq(`Bearer ${makeToken(payload, SECRET)}`);
    auth(req, mockRes(), next);
    expect(req.user).toHaveProperty("userId", FAKE_ID);
    expect(req.user).toHaveProperty("role", "admin");
    expect(req.user).toHaveProperty("jurisdictionState", null);
  });
});

describe("adminOnly middleware", () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    next = vi.fn();
  });

  it("returns 403 when role is registrar", () => {
    const req = { user: { role: "registrar" } } as unknown as Request;
    const res = mockRes();
    adminOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when req.user is absent", () => {
    adminOnly({} as Request, mockRes(), next);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when role is admin", () => {
    const req = { user: { role: "admin" } } as unknown as Request;
    adminOnly(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });
});
