import axios from "axios";

export const api = axios.create({ baseURL: "http://localhost:3001/api" });

// Attach JWT to all requests
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("clis_token");
  if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem("clis_token")) {
      localStorage.removeItem("clis_token");
      localStorage.removeItem("clis_user");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  },
);

// ── Public ────────────────────────────────────────────────
export async function verifyTitle(ref: string) {
  const { data } = await api.get(`/titles/${encodeURIComponent(ref)}`);
  return data as {
    found: boolean;
    searched?: string;
    titleRef?: string;
    jurisdictionState?: string;
    registrationDate?: string;
    status?: string;
    disputeCase?: string | null;
    lastVerified?: string;
  };
}

// ── Auth ──────────────────────────────────────────────────
export async function loginCredentials(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  return data as { tempToken: string; name: string; email: string };
}

export async function loginMfa(tempToken: string, code: string) {
  const { data } = await api.post("/auth/mfa", { tempToken, code });
  return data as {
    accessToken: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: "registrar" | "admin";
      userCode: string;
      jurisdictionState: string | null;
    };
  };
}

// ── Dashboard ─────────────────────────────────────────────
export async function fetchDashboardStats() {
  const { data } = await api.get("/admin/dashboard/stats");
  return data as {
    totalTitles: number;
    titlesThisMonth: number;
    activeDisputes: number;
    pendingReviews: number;
  };
}

export async function fetchRecentActivity() {
  const { data } = await api.get("/admin/dashboard/recent");
  return data as Array<{
    timestamp: string;
    user_code: string;
    operation: string;
    record_ref: string;
    jurisdiction_state: string;
    lga: string;
    status: string;
  }>;
}

// ── Titles ────────────────────────────────────────────────
export async function lookupTitle(ref: string) {
  const { data } = await api.get(`/admin/titles/${encodeURIComponent(ref)}`);
  return data as {
    found: boolean;
    searched?: string;
    title?: {
      title_ref: string;
      owner_nin_last4: string;
      owner_name_masked: string;
      jurisdiction_state: string;
      lga: string;
      latitude: string;
      longitude: string;
      document_ref: string;
      registration_date: string;
      status: string;
      registered_by: string;
      dispute_case: string | null;
      last_modified: string;
    };
  };
}

export async function registerTitle(payload: {
  titleRef: string;
  ownerNinLast4: string;
  ownerNameMasked: string;
  jurisdictionState: string;
  lga: string;
  latitude: number;
  longitude: number;
  documentRef: string;
  registrationDate: string;
}) {
  const { data } = await api.post("/admin/titles", payload);
  return data as { title: object; nearby: string[] };
}

export async function flagDispute(ref: string, disputeCase: string) {
  const { data } = await api.patch(
    `/admin/titles/${encodeURIComponent(ref)}/dispute`,
    { disputeCase },
  );
  return data as { ok: boolean };
}

// ── Audit ─────────────────────────────────────────────────
export async function fetchAuditLog(
  params: {
    offset?: number;
    limit?: number;
    operation?: string;
    state?: string;
    user?: string;
    from?: string;
    to?: string;
  } = {},
) {
  const { data } = await api.get("/admin/audit", { params });
  return data as {
    entries: Array<{
      id: number;
      timestamp: string;
      user_code: string;
      operation: string;
      record_ref: string;
      before_state: object | null;
      after_state: object;
    }>;
    total: number;
    limit: number;
    offset: number;
  };
}
