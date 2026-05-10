import { AdminLayout } from "@/components/AdminLayout";
import { fetchAuditLog } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const PAGE_SIZE = 25;

export function AuditLogPage() {
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({
    operation: "",
    state: "",
    user: "USR-*",
    from: "2026-04-01",
    to: "2026-05-05",
  });
  const [applied, setApplied] = useState(filters);

  const { data, isFetching } = useQuery({
    queryKey: ["audit", applied, offset],
    queryFn: () =>
      fetchAuditLog({
        offset,
        limit: PAGE_SIZE,
        operation: applied.operation || undefined,
        state: applied.state || undefined,
        user: applied.user.replace("*", "") || undefined,
        from: applied.from || undefined,
        to: applied.to || undefined,
      }),
  });

  const opColor = (op: string) => {
    if (op === "INSERT")
      return { bg: "var(--c-success-50)", color: "var(--c-success-700)" };
    if (op === "UPDATE")
      return { bg: "var(--c-blue-50)", color: "var(--c-blue-800)" };
    return { bg: "var(--c-warning-50)", color: "var(--c-warning-700)" };
  };

  const fmtTs = (ts: string) =>
    new Date(ts)
      .toLocaleString("en-NG", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(",", "");

  const total = data?.total ?? 0;
  const entries = data?.entries ?? [];

  return (
    <AdminLayout active="Audit Log">
      <div className="page-pad">
        {/* Title */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--c-ink-600)"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 018 0v4" />
              </svg>
              <div className="t-micro">Read-only · Append-only · Immutable</div>
            </div>
            <h1 className="t-h1">Audit log</h1>
            <div className="t-body muted" style={{ marginTop: 4 }}>
              Every operation across the registry. Records cannot be edited or
              deleted.
            </div>
          </div>
          <button className="btn btn-secondary btn-sm">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 3v12M5 12l7 7 7-7M3 21h18" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Filter bar */}
        <div
          className="card card-pad-md"
          style={{ background: "var(--c-ink-50)", marginBottom: 16 }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 200,
              }}
            >
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--c-ink-600)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Date range
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  type="date"
                  value={filters.from}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, from: e.target.value }))
                  }
                  style={{ height: 36, fontSize: 13 }}
                />
                <input
                  className="input"
                  type="date"
                  value={filters.to}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, to: e.target.value }))
                  }
                  style={{ height: 36, fontSize: 13 }}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 160,
              }}
            >
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--c-ink-600)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Operation
              </label>
              <select
                className="input select"
                value={filters.operation}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, operation: e.target.value }))
                }
                style={{ height: 36, fontSize: 13 }}
              >
                <option value="">All operations</option>
                <option value="INSERT">INSERT</option>
                <option value="UPDATE">UPDATE</option>
                <option value="FLAG_DISPUTE">FLAG_DISPUTE</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 200,
              }}
            >
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--c-ink-600)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Jurisdiction
              </label>
              <select
                className="input select"
                value={filters.state}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, state: e.target.value }))
                }
                style={{ height: 36, fontSize: 13 }}
              >
                <option value="">All states</option>
                <option value="LAGOS">Lagos</option>
                <option value="ABUJA">FCT Abuja</option>
                <option value="KANO">Kano</option>
                <option value="RIVERS">Rivers</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 180,
              }}
            >
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--c-ink-600)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                User
              </label>
              <input
                className="input t-mono"
                value={filters.user}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, user: e.target.value }))
                }
                style={{ height: 36, fontSize: 13 }}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginLeft: "auto",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn btn-primary btn-sm"
                style={{ height: 36 }}
                onClick={() => {
                  setApplied(filters);
                  setOffset(0);
                }}
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th style={{ width: 170 }}>Timestamp (WAT)</th>
                  <th style={{ width: 130 }}>User</th>
                  <th style={{ width: 130 }}>Operation</th>
                  <th style={{ width: 180 }}>Record</th>
                  <th>Before → After</th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: 32,
                        color: "var(--c-ink-500)",
                      }}
                    >
                      Loading…
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: 32,
                        color: "var(--c-ink-500)",
                      }}
                    >
                      No records match the current filters.
                    </td>
                  </tr>
                ) : (
                  entries.map((row) => {
                    const { bg, color } = opColor(row.operation);
                    const before = row.before_state
                      ? JSON.stringify(row.before_state)
                      : null;
                    const after = JSON.stringify(row.after_state);
                    return (
                      <tr key={row.id}>
                        <td>
                          <span
                            className="t-mono tabular"
                            style={{ fontSize: 12 }}
                          >
                            {fmtTs(row.timestamp)}
                          </span>
                        </td>
                        <td>
                          <span
                            className="t-mono"
                            style={{ fontSize: 12, fontWeight: 600 }}
                          >
                            {row.user_code}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: bg,
                              color,
                              fontFamily: "var(--f-mono)",
                              fontWeight: 600,
                            }}
                          >
                            {row.operation}
                          </span>
                        </td>
                        <td>
                          <span
                            className="t-mono"
                            style={{ fontSize: 12, fontWeight: 600 }}
                          >
                            {row.record_ref}
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontFamily: "var(--f-mono)",
                              fontSize: 11.5,
                              color: "var(--c-ink-700)",
                            }}
                          >
                            {before ? (
                              <span
                                style={{
                                  background: "var(--c-danger-50)",
                                  padding: "1px 6px",
                                  borderRadius: 3,
                                }}
                              >
                                {before}
                              </span>
                            ) : (
                              <span
                                className="muted"
                                style={{
                                  fontStyle: "italic",
                                  fontFamily: "var(--f-sans)",
                                  fontSize: 12,
                                }}
                              >
                                (new)
                              </span>
                            )}
                            <span style={{ color: "var(--c-ink-500)" }}>→</span>
                            <span
                              style={{
                                background: "var(--c-success-50)",
                                padding: "1px 6px",
                                borderRadius: 3,
                              }}
                            >
                              {after}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 20px",
              borderTop: "1px solid var(--c-ink-100)",
              background: "var(--c-ink-50)",
            }}
          >
            <div className="t-small muted">
              Showing{" "}
              <strong>
                {Math.min(offset + 1, total)}–
                {Math.min(offset + PAGE_SIZE, total)}
              </strong>{" "}
              of <span className="t-mono">{total.toLocaleString()}</span>{" "}
              records
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={offset === 0}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              >
                ← Prev
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
