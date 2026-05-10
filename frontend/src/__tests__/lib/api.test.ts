import axios from "axios";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
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

// ---------------------------------------------------------------------------
// vi.mock is hoisted before any variable declarations in this file.
// Define the mock instance INSIDE the factory so it exists when create() runs.
// ---------------------------------------------------------------------------
vi.mock("axios", () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: { create: vi.fn(() => mockAxiosInstance) },
  };
});

// Retrieve the shared instance after mocking by calling the already-mocked
// create(). This returns the same object api.ts received on import.
const mockAxiosInstance = vi.mocked(axios.create).mock.results[0].value as {
  get: Mock;
  post: Mock;
  patch: Mock;
  interceptors: { request: { use: Mock }; response: { use: Mock } };
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// verifyTitle
// ---------------------------------------------------------------------------
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

  it("returns found: false with searched ref when title does not exist", async () => {
    const data = { found: false, searched: "LAGOS-2099-99999" };
    mockAxiosInstance.get.mockResolvedValueOnce({ data });
    const result = await verifyTitle("LAGOS-2099-99999");
    expect(result.found).toBe(false);
    expect(result.searched).toBe("LAGOS-2099-99999");
  });

  it("surfaces the disputeCase when the title is under dispute", async () => {
    const data = {
      found: true,
      titleRef: "LAGOS-2024-00142",
      status: "disputed",
      disputeCase: "DSP-2026-0001",
    };
    mockAxiosInstance.get.mockResolvedValueOnce({ data });
    const result = await verifyTitle("LAGOS-2024-00142");
    expect(result.disputeCase).toBe("DSP-2026-0001");
    expect(result.status).toBe("disputed");
  });

  it("propagates network errors to the caller", async () => {
    mockAxiosInstance.get.mockRejectedValueOnce(new Error("Network Error"));
    await expect(verifyTitle("LAGOS-2024-00000")).rejects.toThrow(
      "Network Error",
    );
  });
});

// ---------------------------------------------------------------------------
// loginCredentials
// ---------------------------------------------------------------------------
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

  it("returns the email from the response", async () => {
    const data = {
      tempToken: "tok-xyz",
      name: "Emeka Eze",
      email: "e.eze@lagosstate.gov.ng",
    };
    mockAxiosInstance.post.mockResolvedValueOnce({ data });
    const result = await loginCredentials("e.eze@lagosstate.gov.ng", "s3cr3t");
    expect(result.email).toBe("e.eze@lagosstate.gov.ng");
  });

  it("propagates 401 errors on wrong credentials", async () => {
    const err = Object.assign(new Error("Unauthorized"), {
      response: { status: 401 },
    });
    mockAxiosInstance.post.mockRejectedValueOnce(err);
    await expect(loginCredentials("bad@user.com", "wrong")).rejects.toThrow(
      "Unauthorized",
    );
  });
});

// ---------------------------------------------------------------------------
// loginMfa
// ---------------------------------------------------------------------------
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

  it("returns accessToken", async () => {
    const data = { accessToken: "jwt-abc", user: { id: 1, role: "registrar" } };
    mockAxiosInstance.post.mockResolvedValueOnce({ data });
    const result = await loginMfa("tmp", "654321");
    expect(result.accessToken).toBe("jwt-abc");
  });

  it("returns the full user object", async () => {
    const user = { id: 42, role: "admin", name: "Funmi Adeyemi" };
    mockAxiosInstance.post.mockResolvedValueOnce({
      data: { accessToken: "jwt-xyz", user },
    });
    const result = await loginMfa("tmp-tok-2", "000000");
    expect(result.user).toEqual(user);
  });

  it("propagates 403 when the MFA code is invalid", async () => {
    const err = Object.assign(new Error("Forbidden"), {
      response: { status: 403 },
    });
    mockAxiosInstance.post.mockRejectedValueOnce(err);
    await expect(loginMfa("tmp-tok", "wrong-code")).rejects.toThrow(
      "Forbidden",
    );
  });
});

// ---------------------------------------------------------------------------
// fetchDashboardStats
// ---------------------------------------------------------------------------
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

  it("returns all stat fields", async () => {
    const data = {
      totalTitles: 4200,
      titlesThisMonth: 38,
      activeDisputes: 7,
      pendingReviews: 15,
    };
    mockAxiosInstance.get.mockResolvedValueOnce({ data });
    const result = await fetchDashboardStats();
    expect(result).toEqual(data);
  });

  it("returns zero counts when the database is empty", async () => {
    const data = {
      totalTitles: 0,
      titlesThisMonth: 0,
      activeDisputes: 0,
      pendingReviews: 0,
    };
    mockAxiosInstance.get.mockResolvedValueOnce({ data });
    const result = await fetchDashboardStats();
    expect(result.totalTitles).toBe(0);
    expect(result.activeDisputes).toBe(0);
  });

  it("propagates server errors to the caller", async () => {
    mockAxiosInstance.get.mockRejectedValueOnce(
      new Error("Internal Server Error"),
    );
    await expect(fetchDashboardStats()).rejects.toThrow(
      "Internal Server Error",
    );
  });
});

// ---------------------------------------------------------------------------
// fetchRecentActivity
// ---------------------------------------------------------------------------
describe("fetchRecentActivity", () => {
  it("calls GET /admin/dashboard/recent", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
    await fetchRecentActivity();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      "/admin/dashboard/recent",
    );
  });

  it("returns an array of activity entries", async () => {
    const data = [
      {
        id: 1,
        operation: "INSERT",
        titleRef: "LAGOS-2026-05000",
        timestamp: "2026-05-06T10:00:00Z",
      },
      {
        id: 2,
        operation: "UPDATE",
        titleRef: "LAGOS-2024-00142",
        timestamp: "2026-05-06T09:30:00Z",
      },
    ];
    mockAxiosInstance.get.mockResolvedValueOnce({ data });
    const result = await fetchRecentActivity();
    expect(result).toHaveLength(2);
    expect(result[0].operation).toBe("INSERT");
  });

  it("returns an empty array when there is no recent activity", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
    const result = await fetchRecentActivity();
    expect(result).toEqual([]);
  });

  it("propagates network errors to the caller", async () => {
    mockAxiosInstance.get.mockRejectedValueOnce(new Error("Network Error"));
    await expect(fetchRecentActivity()).rejects.toThrow("Network Error");
  });
});

// ---------------------------------------------------------------------------
// lookupTitle
// ---------------------------------------------------------------------------
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

  it("returns the full title record when found", async () => {
    const data = {
      found: true,
      titleRef: "LAGOS-2024-00142",
      ownerNinLast4: "5678",
      ownerNameMasked: "BEL••••",
      jurisdictionState: "Lagos",
      lga: "Eti-Osa",
      latitude: 6.43,
      longitude: 3.42,
      documentRef: "LSR/ETO/2024/A-00142",
      registrationDate: "2024-03-15",
      status: "registered",
      disputeCase: null,
    };
    mockAxiosInstance.get.mockResolvedValueOnce({ data });
    const result = await lookupTitle("LAGOS-2024-00142");
    expect(result).toEqual(data);
  });

  it("returns found: false for an unregistered ref", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: { found: false, searched: "KOGI-2099-00001" },
    });
    const result = await lookupTitle("KOGI-2099-00001");
    expect(result.found).toBe(false);
  });

  it("propagates 404 errors from the server", async () => {
    const err = Object.assign(new Error("Not Found"), {
      response: { status: 404 },
    });
    mockAxiosInstance.get.mockRejectedValueOnce(err);
    await expect(lookupTitle("LAGOS-0000-00000")).rejects.toThrow("Not Found");
  });
});

// ---------------------------------------------------------------------------
// registerTitle
// ---------------------------------------------------------------------------
describe("registerTitle", () => {
  const basePayload = {
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

  it("calls POST /admin/titles with the payload", async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({
      data: { title: {}, nearby: [] },
    });
    await registerTitle(basePayload);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      "/admin/titles",
      basePayload,
    );
  });

  it("returns the created title and nearby records", async () => {
    const title = { ...basePayload, status: "registered" };
    const nearby = [{ titleRef: "LAGOS-2026-04999", distance: 12.4 }];
    mockAxiosInstance.post.mockResolvedValueOnce({ data: { title, nearby } });
    const result = await registerTitle(basePayload);
    expect(result.title).toEqual(title);
    expect(result.nearby).toHaveLength(1);
  });

  it("returns an empty nearby array when no adjacent titles exist", async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({
      data: { title: basePayload, nearby: [] },
    });
    const result = await registerTitle(basePayload);
    expect(result.nearby).toEqual([]);
  });

  it("propagates 409 conflict when the titleRef is already registered", async () => {
    const err = Object.assign(new Error("Conflict"), {
      response: { status: 409 },
    });
    mockAxiosInstance.post.mockRejectedValueOnce(err);
    await expect(registerTitle(basePayload)).rejects.toThrow("Conflict");
  });

  it("propagates 422 when the payload is invalid", async () => {
    const err = Object.assign(new Error("Unprocessable Entity"), {
      response: { status: 422 },
    });
    mockAxiosInstance.post.mockRejectedValueOnce(err);
    await expect(registerTitle(basePayload)).rejects.toThrow(
      "Unprocessable Entity",
    );
  });
});

// ---------------------------------------------------------------------------
// flagDispute
// ---------------------------------------------------------------------------
describe("flagDispute", () => {
  it("calls PATCH /admin/titles/:ref/dispute", async () => {
    mockAxiosInstance.patch.mockResolvedValueOnce({ data: { ok: true } });
    await flagDispute("LAGOS-2024-00142", "DSP-2026-0001");
    expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
      "/admin/titles/LAGOS-2024-00142/dispute",
      { disputeCase: "DSP-2026-0001" },
    );
  });

  it("returns { ok: true } on success", async () => {
    mockAxiosInstance.patch.mockResolvedValueOnce({ data: { ok: true } });
    const result = await flagDispute("LAGOS-2024-00142", "DSP-2026-0001");
    expect(result.ok).toBe(true);
  });

  it("sends the correct disputeCase value in the body", async () => {
    mockAxiosInstance.patch.mockResolvedValueOnce({ data: { ok: true } });
    await flagDispute("LAGOS-2024-00142", "DSP-2026-9999");
    const [, body] = mockAxiosInstance.patch.mock.calls[0];
    expect(body).toEqual({ disputeCase: "DSP-2026-9999" });
  });

  it("propagates 404 when the title does not exist", async () => {
    const err = Object.assign(new Error("Not Found"), {
      response: { status: 404 },
    });
    mockAxiosInstance.patch.mockRejectedValueOnce(err);
    await expect(
      flagDispute("LAGOS-9999-99999", "DSP-2026-0001"),
    ).rejects.toThrow("Not Found");
  });

  it("propagates 409 when a dispute is already active on the title", async () => {
    const err = Object.assign(new Error("Conflict"), {
      response: { status: 409 },
    });
    mockAxiosInstance.patch.mockRejectedValueOnce(err);
    await expect(
      flagDispute("LAGOS-2024-00142", "DSP-2026-0002"),
    ).rejects.toThrow("Conflict");
  });
});

// ---------------------------------------------------------------------------
// fetchAuditLog
// ---------------------------------------------------------------------------
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

  it("returns entries, total, limit, and offset", async () => {
    const data = {
      entries: [
        {
          id: 1,
          operation: "INSERT",
          titleRef: "LAGOS-2026-05000",
          actor: "registrar@lagosstate.gov.ng",
          timestamp: "2026-05-06T10:00:00Z",
        },
      ],
      total: 1,
      limit: 25,
      offset: 0,
    };
    mockAxiosInstance.get.mockResolvedValueOnce({ data });
    const result = await fetchAuditLog();
    expect(result.entries).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.offset).toBe(0);
  });

  it("returns an empty entries array when no audit records match", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: { entries: [], total: 0, limit: 25, offset: 0 },
    });
    const result = await fetchAuditLog({ operation: "DELETE" });
    expect(result.entries).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("passes only the provided subset of filter params", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: { entries: [], total: 0, limit: 25, offset: 0 },
    });
    await fetchAuditLog({ state: "ABUJA" });
    expect(mockAxiosInstance.get).toHaveBeenCalledWith("/admin/audit", {
      params: { state: "ABUJA" },
    });
  });

  it("supports pagination via offset and limit", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: { entries: [], total: 200, limit: 50, offset: 100 },
    });
    const result = await fetchAuditLog({ offset: 100, limit: 50 });
    expect(mockAxiosInstance.get).toHaveBeenCalledWith("/admin/audit", {
      params: { offset: 100, limit: 50 },
    });
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(100);
  });

  it("propagates server errors to the caller", async () => {
    mockAxiosInstance.get.mockRejectedValueOnce(
      new Error("Internal Server Error"),
    );
    await expect(fetchAuditLog()).rejects.toThrow("Internal Server Error");
  });
});
