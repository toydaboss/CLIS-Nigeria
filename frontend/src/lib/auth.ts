export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: "registrar" | "admin";
  userCode: string;
  jurisdictionState: string | null;
}

export function getUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem("clis_user");
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: CurrentUser) {
  localStorage.setItem("clis_token", token);
  localStorage.setItem("clis_user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("clis_token");
  localStorage.removeItem("clis_user");
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("clis_token");
}
