import { AdminLayout } from "@/components/AdminLayout";
import { StatusBadge, statusToKind } from "@/components/StatusBadges";
import { lookupTitle } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="t-micro" style={{ marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: "var(--c-ink-1000)" }}>{value}</div>
    </div>
  );
}

export function LookupPage() {
  const [input, setInput] = useState("ABUJA-2022-08891");
  const [query, setQuery] = useState("");

  const { data, isFetching, isError } = useQuery({
    queryKey: ["admin-lookup", query],
    queryFn: () => lookupTitle(query),
    enabled: !!query,
    retry: false,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) setQuery(input.trim().toUpperCase());
  };

  const t = data?.title;

  const fmtDate = (d: string | undefined) =>
    d
      ? new Date(d).toLocaleDateString("en-NG", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <AdminLayout active="Verification Lookup">
      <div className="page-pad" style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <div
            className="t-micro"
            style={{ color: "var(--c-blue-700)", marginBottom: 4 }}
          >
            Internal Lookup
          </div>
          <h1 className="t-h1">Verify a title (admin view)</h1>
          <div className="t-body muted" style={{ marginTop: 4 }}>
            Includes document reference and registrar metadata not shown
            publicly.
          </div>
        </div>

        {/* Search */}
        <div className="card card-pad-md" style={{ marginBottom: 20 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12 }}>
            <input
              className="input t-mono"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="STATE-YEAR-NNNNN"
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isFetching}
            >
              {isFetching ? "Searching…" : "Search"}
            </button>
          </form>
        </div>

        {/* Result */}
        {isError && (
          <div
            className="card card-pad-lg"
            style={{ textAlign: "center", color: "var(--c-danger-700)" }}
          >
            Could not reach the registry. Please try again.
          </div>
        )}

        {data?.found === false && (
          <div className="card card-pad-lg" style={{ textAlign: "center" }}>
            <div className="t-h3" style={{ marginBottom: 8 }}>
              No record found
            </div>
            <div className="t-small muted">
              No title with reference{" "}
              <span className="t-mono">{data.searched}</span> exists in the
              registry.
            </div>
          </div>
        )}

        {data?.found && t && (
          <div
            className="card"
            style={{
              borderTop: `4px solid ${t.status === "disputed" ? "var(--c-warning-600)" : t.status === "registered" ? "var(--c-success-600)" : "var(--c-ink-300)"}`,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid var(--c-ink-100)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <StatusBadge kind={statusToKind(t.status)}>
                  {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                </StatusBadge>
                <span
                  className="t-mono"
                  style={{ fontSize: 18, fontWeight: 600 }}
                >
                  {t.title_ref}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-secondary btn-sm">
                  View history
                </button>
                <button className="btn btn-danger btn-sm">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <path d="M4 21V5a2 2 0 012-2h11l-2 4 2 4H6" />
                  </svg>
                  Flag for dispute
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="grid-3" style={{ padding: 24 }}>
              <FieldRow
                label="Jurisdiction"
                value={`${t.jurisdiction_state} Registry`}
              />
              <FieldRow
                label="Registered on"
                value={fmtDate(t.registration_date)}
              />
              <FieldRow
                label="Document Ref."
                value={<span className="t-mono">{t.document_ref}</span>}
              />
              <FieldRow
                label="Registered by"
                value={<span className="t-mono">{t.registered_by}</span>}
              />
              <FieldRow
                label="Coordinates"
                value={
                  <span className="t-mono">
                    {parseFloat(t.latitude).toFixed(4)}° N,{" "}
                    {parseFloat(t.longitude).toFixed(4)}° E
                  </span>
                }
              />
              <FieldRow
                label="Last modified"
                value={fmtDate(t.last_modified)}
              />
              <FieldRow
                label="Owner NIN (last 4)"
                value={
                  <span className="t-mono">***-****-{t.owner_nin_last4}</span>
                }
              />
              <FieldRow
                label="Owner Name"
                value={<span className="t-mono">{t.owner_name_masked}</span>}
              />
              {t.dispute_case && (
                <FieldRow
                  label="Dispute case"
                  value={
                    <span
                      className="t-mono"
                      style={{ color: "var(--c-warning-700)", fontWeight: 600 }}
                    >
                      {t.dispute_case}
                    </span>
                  }
                />
              )}
            </div>

            {/* Dispute notice */}
            {t.status === "disputed" && (
              <div
                style={{
                  padding: "14px 24px",
                  background: "var(--c-warning-50)",
                  borderTop: "1px solid var(--c-warning-100)",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  color: "var(--c-warning-700)",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span className="t-small">
                  Active dispute on file · boundary overlap claim. Case:{" "}
                  <span className="t-mono" style={{ fontWeight: 600 }}>
                    {t.dispute_case}
                  </span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
