import { AdminLayout } from "@/components/AdminLayout";
import { RefChip } from "@/components/RefChip";
import { fetchTitles, flagDispute } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const PAGE_SIZE = 20;

export function DisputesPage() {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [flagging, setFlagging] = useState<string | null>(null);
  const [caseRef, setCaseRef] = useState("");
  const [error, setError] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["titles", "disputed", offset],
    queryFn: () =>
      fetchTitles({ status: "disputed", offset, limit: PAGE_SIZE }),
  });

  const mutation = useMutation({
    mutationFn: ({ ref, disputeCase }: { ref: string; disputeCase: string }) =>
      flagDispute(ref, disputeCase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["titles", "disputed"] });
      setFlagging(null);
      setCaseRef("");
      setError("");
    },
    onError: () => {
      setError("Failed to update dispute. Please try again.");
    },
  });

  const titles = data?.titles ?? [];
  const total = data?.total ?? 0;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

  const handleFlag = (ref: string) => {
    if (!caseRef.trim()) {
      setError("Enter a dispute case reference.");
      return;
    }
    setError("");
    mutation.mutate({ ref, disputeCase: caseRef.trim() });
  };

  return (
    <AdminLayout active="Disputes">
      <div className="page-pad">
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
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
                stroke="var(--c-warning-600)"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M12 2L2 21h20L12 2zM12 9v5M12 17h.01" />
              </svg>
              <div
                className="t-micro"
                style={{ color: "var(--c-warning-700)" }}
              >
                Active dispute cases
              </div>
            </div>
            <h1 className="t-h1">Disputes</h1>
            <div className="t-body muted" style={{ marginTop: 4 }}>
              Land titles currently flagged with an active legal dispute.
            </div>
          </div>
          <div
            className="badge badge-warning"
            style={{ fontSize: 14, padding: "6px 14px" }}
          >
            {total} active
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Title Reference</th>
                  <th>Jurisdiction</th>
                  <th>LGA</th>
                  <th>Dispute Case</th>
                  <th>Registered</th>
                  <th style={{ width: 160 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "var(--c-ink-500)",
                      }}
                    >
                      Loading…
                    </td>
                  </tr>
                ) : titles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "var(--c-ink-500)",
                      }}
                    >
                      No disputed titles found.
                    </td>
                  </tr>
                ) : (
                  titles.map((t) => (
                    <>
                      <tr key={t.titleRef}>
                        <td>
                          <RefChip value={t.titleRef} />
                        </td>
                        <td>{t.jurisdictionState}</td>
                        <td>{t.lga}</td>
                        <td>
                          {t.disputeCase ? (
                            <span
                              className="t-mono"
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "var(--c-warning-700)",
                              }}
                            >
                              {t.disputeCase}
                            </span>
                          ) : (
                            <span
                              className="muted"
                              style={{ fontStyle: "italic", fontSize: 12 }}
                            >
                              Not assigned
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {fmtDate(t.registrationDate)}
                        </td>
                        <td>
                          {flagging === t.titleRef ? (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setFlagging(null);
                                setCaseRef("");
                                setError("");
                              }}
                              style={{ fontSize: 12 }}
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setFlagging(t.titleRef);
                                setCaseRef(t.disputeCase ?? "");
                                setError("");
                              }}
                              style={{ fontSize: 12 }}
                            >
                              Update case ref
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Inline flag form */}
                      {flagging === t.titleRef && (
                        <tr
                          key={`${t.titleRef}-form`}
                          style={{ background: "var(--c-warning-50)" }}
                        >
                          <td colSpan={6} style={{ padding: "12px 20px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "var(--c-ink-700)",
                                  minWidth: 130,
                                }}
                              >
                                Dispute case ref:
                              </div>
                              <input
                                className="input t-mono"
                                value={caseRef}
                                onChange={(e) => {
                                  setCaseRef(e.target.value);
                                  setError("");
                                }}
                                placeholder="e.g. DSP-2026-0418"
                                style={{ height: 34, fontSize: 13, width: 220 }}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleFlag(t.titleRef)
                                }
                                autoFocus
                              />
                              <button
                                className="btn btn-primary btn-sm"
                                disabled={mutation.isPending}
                                onClick={() => handleFlag(t.titleRef)}
                                style={{ fontSize: 12 }}
                              >
                                {mutation.isPending ? "Saving…" : "Save"}
                              </button>
                              {error && (
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "var(--c-danger-600)",
                                  }}
                                >
                                  {error}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
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
              of <strong>{total}</strong> disputes
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
