import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminOnly, auth } from "../../middleware/auth";

const SECRET = process.env.JWT_SECRET!;

function mockReq(authHeader?: string): Request {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as Request;
}

function mockRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;
  // chain: res.status(401).json({...})
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
    const req = mockReq();
    auth(req, mockRes(), next);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when scheme is not Bearer", () => {
    const req = mockReq("Basic dXNlcjpwYXNz");
    const res = mockRes();
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for a malformed / unsigned token", () => {
    const req = mockReq("Bearer not.a.real.jwt");
    const res = mockRes();
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when token is signed with the wrong secret", () => {
    const token = makeToken({ userId: 1, role: "registrar" }, "wrong-secret");
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when token is expired", () => {
    const token = makeToken({ userId: 1, role: "registrar" }, SECRET, {
      expiresIn: -1,
    });
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("calls next() and sets req.user when token is valid", () => {
    const payload = {
      userId: 5,
      userCode: "USR-LSR-0241",
      role: "registrar",
      jurisdictionState: "Lagos",
    };
    const token = makeToken(payload, SECRET);
    const req = mockReq(`Bearer ${token}`);
    auth(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject(payload);
  });

  it("populates req.user with all required fields", () => {
    const payload = {
      userId: 1,
      userCode: "USR-ADM-0001",
      role: "admin",
      jurisdictionState: null,
    };
    const token = makeToken(payload, SECRET);
    const req = mockReq(`Bearer ${token}`);
    auth(req, mockRes(), next);
    expect(req.user).toHaveProperty("userId", 1);
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
    const req = {} as Request;
    const res = mockRes();
    adminOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("calls next() when role is admin", () => {
    const req = { user: { role: "admin" } } as unknown as Request;
    adminOnly(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });
});
