import { AdminLayout } from "@/components/AdminLayout";
import { StatusBadge, statusToKind } from "@/components/StatusBadges";
import { fetchDashboardStats, fetchRecentActivity } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

const BAR_DATA = [42, 58, 49, 71, 63, 88, 95, 72, 110, 84, 76, 92, 124, 138];

function StatCard({
  label,
  value,
  delta,
  accent,
  deltaKind,
}: {
  label: string;
  value: string | number;
  delta: string;
  accent: string;
  deltaKind?: string;
}) {
  return (
    <div className="stat">
      <div className={`stat-accent ${accent}`} />
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className={`stat-delta ${deltaKind ?? ""}`}>{delta}</div>
    </div>
  );
}

export function DashboardPage() {
  const user = getUser();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  const { data: recent } = useQuery({
    queryKey: ["dashboard-recent"],
    queryFn: fetchRecentActivity,
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const firstName = user?.name.split(" ")[0] ?? "there";

  const maxBar = Math.max(...BAR_DATA);

  return (
    <AdminLayout active="Dashboard">
      <div className="page-pad">
        {/* Welcome banner */}
        <div
          className="card"
          style={{
            background:
              "linear-gradient(135deg, var(--c-blue-900), var(--c-blue-700))",
            color: "#fff",
            border: "none",
            padding: "24px 28px",
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -40,
              top: -40,
              width: 200,
              height: 200,
              opacity: 0.12,
              background:
                "radial-gradient(circle, var(--c-gold-500) 0%, transparent 70%)",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                className="t-micro"
                style={{ color: "var(--c-gold-300)", marginBottom: 4 }}
              >
                {user?.jurisdictionState
                  ? `${user.jurisdictionState} State Registry · `
                  : ""}
                {today}
              </div>
              <div className="t-h1" style={{ color: "#fff", marginBottom: 4 }}>
                {greeting}, {firstName}.
              </div>
              <div
                className="t-body"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                You have {stats?.pendingReviews ?? "—"} pending reviews and{" "}
                {stats?.activeDisputes ?? "—"} active disputes today.
              </div>
            </div>
            <button
              className="btn btn-gold"
              onClick={() => navigate({ to: "/admin/register" })}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Register New Title
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          <StatCard
            label="Total Registered Titles"
            value={stats?.totalTitles ?? "—"}
            delta="+1.2% MoM"
            accent=""
          />
          <StatCard
            label="Titles This Month"
            value={stats?.titlesThisMonth ?? "—"}
            delta="+12% vs last month"
            accent="gold"
          />
          <StatCard
            label="Active Disputes"
            value={stats?.activeDisputes ?? "—"}
            delta="+4 this week"
            accent="warn"
            deltaKind="warn"
          />
          <StatCard
            label="Pending Reviews"
            value={stats?.pendingReviews ?? "—"}
            delta="Action needed"
            accent="danger"
            deltaKind="danger"
          />
        </div>

        {/* Two-column */}
        <div className="grid-dash">
          {/* Recent activity */}
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 20px",
                borderBottom: "1px solid var(--c-ink-100)",
              }}
            >
              <div className="t-h3">Recent activity</div>
              <a
                className="t-small"
                style={{
                  color: "var(--c-blue-700)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                View all →
              </a>
            </div>
            <div className="table-wrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Title Ref.</th>
                    <th>Operation</th>
                    <th>Jurisdiction</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(recent ?? []).slice(0, 5).map((row, i) => {
                    const isInsert = row.operation === "INSERT";
                    const timeAgo = (() => {
                      const diff =
                        Date.now() - new Date(row.timestamp).getTime();
                      const m = Math.floor(diff / 60000);
                      if (m < 60) return `${m} min ago`;
                      return `${Math.floor(m / 60)}h ${m % 60}m ago`;
                    })();
                    return (
                      <tr key={i}>
                        <td>
                          <span
                            className="t-mono"
                            style={{ fontSize: 12, fontWeight: 600 }}
                          >
                            {row.record_ref}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: isInsert
                                ? "var(--c-success-50)"
                                : "var(--c-blue-50)",
                              color: isInsert
                                ? "var(--c-success-700)"
                                : "var(--c-blue-800)",
                              fontFamily: "var(--f-mono)",
                              fontWeight: 600,
                            }}
                          >
                            {row.operation}
                          </span>
                        </td>
                        <td className="muted" style={{ fontSize: 13 }}>
                          {[row.jurisdiction_state, row.lga]
                            .filter(Boolean)
                            .join(" · ")}
                        </td>
                        <td>
                          <StatusBadge kind={statusToKind(row.status)} small>
                            {row.status?.toUpperCase()}
                          </StatusBadge>
                        </td>
                        <td className="muted tabular" style={{ fontSize: 12 }}>
                          {timeAgo}
                        </td>
                      </tr>
                    );
                  })}
                  {(!recent || recent.length === 0) && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          padding: 32,
                          color: "var(--c-ink-500)",
                        }}
                      >
                        No recent activity
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Bar chart */}
            <div className="card card-pad-md">
              <div className="t-h3" style={{ marginBottom: 14 }}>
                Registrations · last 14 days
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 4,
                  height: 100,
                }}
              >
                {BAR_DATA.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${(v / maxBar) * 100}%`,
                      background:
                        i === BAR_DATA.length - 1
                          ? "var(--c-gold-500)"
                          : "var(--c-blue-700)",
                      borderRadius: "2px 2px 0 0",
                      opacity: i === BAR_DATA.length - 1 ? 1 : 0.5 + i * 0.03,
                    }}
                  />
                ))}
              </div>
              <div
                style={{ display: "flex", justifyContent: "space-between" }}
                className="t-small muted"
              >
                <span>22 Apr</span>
                <span>5 May</span>
              </div>
            </div>

            {/* Top jurisdictions */}
            <div className="card card-pad-md">
              <div className="t-h3" style={{ marginBottom: 12 }}>
                Top jurisdictions today
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {[
                  ["Ikeja", 47, 88],
                  ["Lekki", 38, 72],
                  ["Ikoyi", 24, 45],
                  ["Yaba", 18, 34],
                  ["Ajah", 12, 22],
                ].map(([n, c, w]) => (
                  <div
                    key={n}
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div style={{ width: 56, fontSize: 13, fontWeight: 500 }}>
                      {n}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        background: "var(--c-ink-100)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${w}%`,
                          height: "100%",
                          background: "var(--c-blue-700)",
                        }}
                      />
                    </div>
                    <div
                      className="t-mono tabular muted"
                      style={{ fontSize: 12, width: 24, textAlign: "right" }}
                    >
                      {c}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
