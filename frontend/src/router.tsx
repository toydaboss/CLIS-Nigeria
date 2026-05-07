import { getUser, isAuthenticated } from "@/lib/auth";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";

// ── Page imports ────────────────────────────────────────────
import { VerifyPage } from "@/pages/VerifyPage";
import { AuditLogPage } from "@/pages/admin/AuditLogPage";
import { DashboardPage } from "@/pages/admin/DashboardPage";
import { LoginPage } from "@/pages/admin/LoginPage";
import { LookupPage } from "@/pages/admin/LookupPage";
import { RegisterTitlePage } from "@/pages/admin/RegisterTitlePage";

// ── Route definitions ───────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: VerifyPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: "/admin/dashboard" });
  },
  component: LoginPage,
});

// Guard for admin-only routes
function requireAuth() {
  if (!isAuthenticated()) throw redirect({ to: "/admin/login" });
}

function requireAdmin() {
  requireAuth();
  const user = getUser();
  if (user?.role !== "admin") throw redirect({ to: "/admin/dashboard" });
}

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/dashboard",
  beforeLoad: requireAuth,
  component: DashboardPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/register",
  beforeLoad: requireAuth,
  component: RegisterTitlePage,
});

const lookupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/lookup",
  beforeLoad: requireAuth,
  component: LookupPage,
});

const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/audit",
  beforeLoad: requireAdmin,
  component: AuditLogPage,
});

// Catch-all redirect /admin → /admin/dashboard
const adminRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard" });
  },
  component: () => null,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  registerRoute,
  lookupRoute,
  auditRoute,
  adminRedirectRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
