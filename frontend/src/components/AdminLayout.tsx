import { clearAuth, getUser } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
  active: string;
}

const NAV_ITEMS: Array<{
  label: string;
  icon: string;
  path: string;
  count?: number;
}> = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: "M3 12L12 4l9 8M5 10v10h14V10",
  },
  {
    label: "Register Title",
    path: "/admin/register",
    icon: "M12 4v16m-8-8h16",
  },
  {
    label: "Verification Lookup",
    path: "/admin/lookup",
    icon: "M11 5a6 6 0 100 12 6 6 0 000-12zM21 21l-5-5",
  },
  {
    label: "Disputes",
    path: "/admin/disputes",
    icon: "M12 2L2 21h20L12 2zM12 9v5",
  },
];

const ADMIN_ITEMS: Array<{ label: string; icon: string; path: string }> = [
  {
    label: "Audit Log",
    path: "/admin/audit",
    icon: "M5 4h14v16H5zM9 9h6M9 13h6M9 17h4",
  },
  {
    label: "Users & Roles",
    path: "/admin/users",
    icon: "M9 11a4 4 0 100-8 4 4 0 000 8zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11l4 4M21 11l-4 4",
  },
  {
    label: "Jurisdictions",
    path: "/admin/jurisdictions",
    icon: "M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z M9 3v15M15 6v15",
  },
];

export function AdminLayout({ children, active }: AdminLayoutProps) {
  const user = getUser();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  const handleLogout = () => {
    clearAuth();
    navigate({ to: "/admin/login" });
  };

  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--c-paper)",
        overflow: "hidden",
      }}
    >
      <div
        className={`sidebar-overlay${sidebarOpen ? " sidebar-open" : ""}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="clis-mark" style={{ width: 36, height: 36 }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <rect
                x="2"
                y="2"
                width="9"
                height="9"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <rect
                x="11"
                y="11"
                width="9"
                height="9"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <rect x="7" y="7" width="8" height="8" fill="currentColor" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div className="sidebar-brand-name">CLIS</div>
            <div className="sidebar-brand-sub">Admin Portal</div>
          </div>
        </div>

        <div className="sidebar-section">Workspace</div>
        {NAV_ITEMS.map(({ label, icon, path, count }) => (
          <Link
            key={label}
            to={path}
            className={`sidebar-item ${active === label ? "active" : ""}`}
            onClick={closeSidebar}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={icon} />
            </svg>
            {label}
            {count != null && <span className="count">{count}</span>}
          </Link>
        ))}

        {user?.role === "admin" && (
          <>
            <div className="sidebar-section">Administration</div>
            {ADMIN_ITEMS.map(({ label, icon, path }) => (
              <Link
                key={label}
                to={path}
                onClick={closeSidebar}
                className={`sidebar-item ${active === label ? "active" : ""}`}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={icon} />
                </svg>
                {label}
              </Link>
            ))}
          </>
        )}

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              className="sidebar-user-name"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.name}
            </div>
            <div className="sidebar-user-meta">
              {user?.role === "admin"
                ? "Administrator"
                : `State Registrar · ${user?.jurisdictionState}`}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(226,236,245,0.80)",
              borderRadius: 6,
              padding: "5px 10px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
            onClick={handleLogout}
            title="Sign out"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top bar */}
        <div className="topbar">
          {/* Hamburger (mobile only) */}
          <button
            className="topbar-hamburger"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <div className="topbar-search">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-5-5" />
            </svg>
            <input
              className="input"
              placeholder="Search by title reference, parcel ID…"
              style={{ height: 36 }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginLeft: "auto",
            }}
          >
            <span
              className={
                user?.role === "admin"
                  ? "role-chip role-chip-admin"
                  : "role-chip"
              }
            >
              {user?.role === "admin" ? (
                "ADMINISTRATOR"
              ) : (
                <>
                  STATE REGISTRAR
                  <span className="role-chip-divider" />
                  <span className="role-chip-loc">
                    {user?.jurisdictionState?.toUpperCase()}
                  </span>
                </>
              )}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={toggle}
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              style={{ width: 36, padding: 0 }}
            >
              {theme === "dark" ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: 36, padding: 0 }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21a2 2 0 01-4 0" />
              </svg>
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}
