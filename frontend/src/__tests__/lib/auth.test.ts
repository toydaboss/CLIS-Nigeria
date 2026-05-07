import { describe, expect, it } from "vitest";
import {
  clearAuth,
  getUser,
  isAuthenticated,
  setAuth,
  type CurrentUser,
} from "../../lib/auth";

const FAKE_USER: CurrentUser = {
  id: 1,
  name: "Aisha Bello",
  email: "a.bello@lagosstate.gov.ng",
  role: "registrar",
  userCode: "USR-LSR-0241",
  jurisdictionState: "Lagos",
};

describe("setAuth", () => {
  it("stores token in localStorage under clis_token", () => {
    setAuth("my-jwt-token", FAKE_USER);
    expect(localStorage.getItem("clis_token")).toBe("my-jwt-token");
  });

  it("stores serialised user under clis_user", () => {
    setAuth("tok", FAKE_USER);
    const raw = localStorage.getItem("clis_user");
    expect(JSON.parse(raw!)).toMatchObject(FAKE_USER);
  });
});

describe("getUser", () => {
  it("returns null when nothing is stored", () => {
    expect(getUser()).toBeNull();
  });

  it("returns parsed user object after setAuth", () => {
    setAuth("tok", FAKE_USER);
    const user = getUser();
    expect(user).not.toBeNull();
    expect(user!.name).toBe("Aisha Bello");
    expect(user!.role).toBe("registrar");
    expect(user!.jurisdictionState).toBe("Lagos");
  });

  it("returns null when clis_user holds invalid JSON", () => {
    localStorage.setItem("clis_user", "not-json{{{");
    expect(getUser()).toBeNull();
  });

  it("preserves null jurisdictionState for admin users", () => {
    const admin = {
      ...FAKE_USER,
      role: "admin" as const,
      jurisdictionState: null,
    };
    setAuth("tok", admin);
    expect(getUser()!.jurisdictionState).toBeNull();
  });
});

describe("clearAuth", () => {
  it("removes both clis_token and clis_user", () => {
    setAuth("tok", FAKE_USER);
    clearAuth();
    expect(localStorage.getItem("clis_token")).toBeNull();
    expect(localStorage.getItem("clis_user")).toBeNull();
  });

  it("is safe to call when nothing is stored", () => {
    expect(() => clearAuth()).not.toThrow();
  });
});

describe("isAuthenticated", () => {
  it("returns false when no token is stored", () => {
    expect(isAuthenticated()).toBe(false);
  });

  it("returns true after setAuth", () => {
    setAuth("tok", FAKE_USER);
    expect(isAuthenticated()).toBe(true);
  });

  it("returns false after clearAuth", () => {
    setAuth("tok", FAKE_USER);
    clearAuth();
    expect(isAuthenticated()).toBe(false);
  });

  it("returns false when token key exists but is empty string", () => {
    localStorage.setItem("clis_token", "");
    expect(isAuthenticated()).toBe(false);
  });
});
