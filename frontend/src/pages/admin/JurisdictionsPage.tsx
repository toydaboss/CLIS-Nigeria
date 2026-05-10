import { AdminLayout } from "@/components/AdminLayout";
import { fetchJurisdictions, type JurisdictionStat } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export function JurisdictionsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["jurisdictions"],
    queryFn: fetchJurisdictions,
  });

  return (
    <AdminLayout active="Jurisdictions">
      <div className="page-pad" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--color-text)",
          }}
        >
          Jurisdictions
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            color: "var(--color-text-muted)",
            fontSize: 14,
          }}
        >
          Title registration statistics by state
        </p>

        {/* Totals strip */}
        {data && (
          <div className="grid-4" style={{ marginBottom: 28 }}>
            {[
              { label: "States", value: data.totals.states },
              {
                label: "Total Titles",
                value: data.totals.titles.toLocaleString(),
              },
              {
                label: "Active Disputes",
                value: data.totals.disputes.toLocaleString(),
              },
              {
                label: "Registrars",
                value: data.totals.registrars.toLocaleString(),
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  padding: "16px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 6,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: "var(--color-text)",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
          }}
        >
          {isLoading && (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: 14,
              }}
            >
              Loading jurisdictions…
            </div>
          )}
          {isError && (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                color: "#ef4444",
                fontSize: 14,
              }}
            >
              Failed to load jurisdictions.
            </div>
          )}
          {data && data.jurisdictions.length === 0 && (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: 14,
              }}
            >
              No jurisdictions found.
            </div>
          )}
          {data && data.jurisdictions.length > 0 && (
            <div className="table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--color-surface-raised)" }}>
                    {[
                      "State",
                      "Total",
                      "Registered",
                      "Pending",
                      "Disputed",
                      "Registrars",
                      "Last Activity",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--color-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.jurisdictions.map((j: JurisdictionStat, i: number) => (
                    <JurisdictionRow key={j.state} j={j} odd={i % 2 === 1} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function JurisdictionRow({ j, odd }: { j: JurisdictionStat; odd: boolean }) {
  const disputeRate =
    j.totalTitles > 0
      ? ((j.disputedTitles / j.totalTitles) * 100).toFixed(1)
      : "0.0";

  return (
    <tr
      style={{
        background: odd
          ? "var(--color-surface-raised)"
          : "var(--color-surface)",
      }}
    >
      <td style={cell}>
        <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
          {j.state}
        </span>
      </td>
      <td style={cell}>
        <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
          {j.totalTitles.toLocaleString()}
        </span>
      </td>
      <td style={cell}>
        <CountBadge value={j.registeredTitles} color="#22c55e" />
      </td>
      <td style={cell}>
        <CountBadge value={j.pendingTitles} color="#f59e0b" />
      </td>
      <td style={cell}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CountBadge value={j.disputedTitles} color="#ef4444" />
          {j.disputedTitles > 0 && (
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              {disputeRate}%
            </span>
          )}
        </span>
      </td>
      <td style={cell}>
        <span style={{ color: "var(--color-text)", fontSize: 13 }}>
          {j.registrars}
        </span>
      </td>
      <td style={cell}>
        <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
          {j.lastActivity
            ? new Date(j.lastActivity).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </span>
      </td>
    </tr>
  );
}

function CountBadge({ value, color }: { value: number; color: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 32,
        padding: "2px 8px",
        borderRadius: 12,
        background: `${color}18`,
        color,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {value.toLocaleString()}
    </span>
  );
}

const cell: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 13,
  borderBottom: "1px solid var(--color-border)",
  color: "var(--color-text)",
};
