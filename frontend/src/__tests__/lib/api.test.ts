import { beforeEach, describe, expect, it, vi } from "vitest";

// Build a reusable mock axios instance before any import of api.ts
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

vi.mock("axios", () => ({
  default: { create: vi.fn(() => mockAxiosInstance) },
}));

import {
  fetchAuditLog,
  fetchDashboardStats,
  fetchRecentActivity,
  flagDispute,
  loginCredentials,
  loginMfa,
  lookupTitle,
  registerTitle,
  verifyTitle,
} from "../../lib/api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifyTitle", () => {
  it("calls GET /titles/:ref with the ref encoded", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: { found: false, searched: "LAGOS-2024-00000" },
    });
    const result = await verifyTitle("LAGOS-2024-00000");
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      "/titles/LAGOS-2024-00000",
    );
    expect(result.found).toBe(false);
  });

  it("returns the full response data", async () => {
    const data = {
      found: true,
      titleRef: "LAGOS-2024-00142",
      status: "registered",
      disputeCase: null,
    };
    mockAxiosInstance.get.mockResolvedValueOnce({ data });
    const result = await verifyTitle("LAGOS-2024-00142");
    expect(result).toEqual(data);
  });
});

describe("loginCredentials", () => {
  it("calls POST /auth/login with email and password", async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({
      data: { tempToken: "tmp", name: "Aisha", email: "a@b.com" },
    });
    await loginCredentials("a@b.com", "pw123");
    expect(mockAxiosInstance.post).toHaveBeenCalledWith("/auth/login", {
      email: "a@b.com",
      password: "pw123",
    });
  });

  it("returns tempToken and user info", async () => {
    const data = {
      tempToken: "tok",
      name: "Aisha Bello",
      email: "a.bello@lagosstate.gov.ng",
    };
    mockAxiosInstance.post.mockResolvedValueOnce({ data });
    const result = await loginCredentials("a.bello@lagosstate.gov.ng", "pw");
    expect(result.tempToken).toBe("tok");
    expect(result.name).toBe("Aisha Bello");
  });
});

describe("loginMfa", () => {
  it("calls POST /auth/mfa with tempToken and code", async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({
      data: { accessToken: "jwt", user: {} },
    });
    await loginMfa("tmp-tok", "123456");
    expect(mockAxiosInstance.post).toHaveBeenCalledWith("/auth/mfa", {
      tempToken: "tmp-tok",
      code: "123456",
    });
  });

  it("returns accessToken and user", async () => {
    const data = { accessToken: "jwt-abc", user: { id: 1, role: "registrar" } };
    mockAxiosInstance.post.mockResolvedValueOnce({ data });
    const result = await loginMfa("tmp", "654321");
    expect(result.accessToken).toBe("jwt-abc");
  });
});

describe("fetchDashboardStats", () => {
  it("calls GET /admin/dashboard/stats", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: {
        totalTitles: 100,
        titlesThisMonth: 5,
        activeDisputes: 1,
        pendingReviews: 2,
      },
    });
    const result = await fetchDashboardStats();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      "/admin/dashboard/stats",
    );
    expect(result.totalTitles).toBe(100);
  });
});

describe("fetchRecentActivity", () => {
  it("calls GET /admin/dashboard/recent", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
    await fetchRecentActivity();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      "/admin/dashboard/recent",
    );
  });
});

describe("lookupTitle", () => {
  it("calls GET /admin/titles/:ref", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: { found: false } });
    await lookupTitle("LAGOS-2024-00142");
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      "/admin/titles/LAGOS-2024-00142",
    );
  });

  it("URL-encodes the ref", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: { found: false } });
    await lookupTitle("FCT ABUJA-2022-00001");
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      "/admin/titles/FCT%20ABUJA-2022-00001",
    );
  });
});

describe("registerTitle", () => {
  it("calls POST /admin/titles with the payload", async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({
      data: { title: {}, nearby: [] },
    });
    const payload = {
      titleRef: "LAGOS-2026-05000",
      ownerNinLast4: "1234",
      ownerNameMasked: "ADE••••",
      jurisdictionState: "Lagos",
      lga: "Ikeja",
      latitude: 6.52,
      longitude: 3.38,
      documentRef: "LSR/IKJ/2026/A-05000",
      registrationDate: "2026-05-06",
    };
    await registerTitle(payload);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      "/admin/titles",
      payload,
    );
  });
});

describe("flagDispute", () => {
  it("calls PATCH /admin/titles/:ref/dispute", async () => {
    mockAxiosInstance.patch.mockResolvedValueOnce({ data: { ok: true } });
    await flagDispute("LAGOS-2024-00142", "DSP-2026-0001");
    expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
      "/admin/titles/LAGOS-2024-00142/dispute",
      { disputeCase: "DSP-2026-0001" },
    );
  });
});

describe("fetchAuditLog", () => {
  it("calls GET /admin/audit with no params by default", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: { entries: [], total: 0, limit: 25, offset: 0 },
    });
    await fetchAuditLog();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith("/admin/audit", {
      params: {},
    });
  });

  it("passes filter params to the query string", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: { entries: [], total: 0, limit: 25, offset: 0 },
    });
    await fetchAuditLog({
      operation: "INSERT",
      state: "LAGOS",
      offset: 25,
      limit: 10,
    });
    expect(mockAxiosInstance.get).toHaveBeenCalledWith("/admin/audit", {
      params: { operation: "INSERT", state: "LAGOS", offset: 25, limit: 10 },
    });
  });
});
