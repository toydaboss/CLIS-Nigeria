import { Logo } from "@/components/Logo";
import { StatusBadge } from "@/components/StatusBadges";
import { verifyTitle } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FormEvent, useState } from "react";

// ── Federal flag strip ──────────────────────────────────────
function Federal() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "rgba(226,236,245,0.7)",
        fontSize: 11,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontWeight: 600,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="0.5" y="2" width="5" height="12" fill="var(--c-success-600)" />
        <rect
          x="5.5"
          y="2"
          width="5"
          height="12"
          fill="#fff"
          stroke="var(--c-ink-300)"
          strokeWidth="0.5"
        />
        <rect
          x="10.5"
          y="2"
          width="5"
          height="12"
          fill="var(--c-success-600)"
        />
      </svg>
      Federal Republic of Nigeria
    </div>
  );
}

// ── Result cards ────────────────────────────────────────────
function ResultRegistered({
  data,
}: {
  data: NonNullable<ReturnType<typeof useQuery>["data"]> & {
    searched?: string | undefined;
    titleRef?: string | undefined;
    jurisdictionState?: string | undefined;
    registrationDate?: string | undefined;
    status?: string | undefined;
    disputeCase?: string | null | undefined;
    lastVerified?: string | undefined;
  };
}) {
  const fmt = (d: string | undefined) =>
    d
      ? new Date(d).toLocaleDateString("en-NG", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "—";

  return (
    <div
      className="card"
      style={{
        borderTop: "4px solid var(--c-success-600)",
        overflow: "hidden",
      }}
    >
      <div className="card-pad-lg">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <StatusBadge kind="success">Registered</StatusBadge>
          <div className="t-small muted">Verified just now</div>
        </div>
        <div className="t-micro" style={{ marginBottom: 6 }}>
          Title Reference
        </div>
        <div
          className="t-mono"
          style={{
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "var(--c-ink-1000)",
            marginBottom: 24,
          }}
        >
          {data.titleRef}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            paddingTop: 20,
            borderTop: "1px solid var(--c-ink-100)",
          }}
        >
          <div>
            <div className="t-micro">Jurisdiction</div>
            <div className="t-h3" style={{ marginTop: 4 }}>
              {data?.jurisdictionState} Registry
            </div>
          </div>
          <div>
            <div className="t-micro">Registered on</div>
            <div className="t-h3" style={{ marginTop: 4 }}>
              {fmt(data?.registrationDate)}
            </div>
          </div>
          <div>
            <div className="t-micro">Dispute status</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="var(--c-success-600)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8.5l3.2 3L13 4.5" />
              </svg>
              <span className="t-h3" style={{ color: "var(--c-success-700)" }}>
                None on record
              </span>
            </div>
          </div>
          <div>
            <div className="t-micro">Last verified</div>
            <div className="t-h3" style={{ marginTop: 4 }}>
              {fmt(data.lastVerified)}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 24,
            padding: "14px 16px",
            background: "var(--c-success-50)",
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--c-success-100)",
          }}
        >
          <div
            className="t-small"
            style={{
              color: "var(--c-success-700)",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              style={{ flexShrink: 0, marginTop: 1 }}
            >
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 5v3.5M8 11h.01" />
            </svg>
            <span>
              This title is officially registered in the CLIS Nigeria national
              database. Owner identity is not disclosed publicly under the NDPA
              2023.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultDisputed({
  data,
}: {
  data: NonNullable<ReturnType<typeof useQuery>["data"]> & {
    searched?: string | undefined;
    titleRef?: string | undefined;
    jurisdictionState?: string | undefined;
    registrationDate?: string | undefined;
    status?: string | undefined;
    disputeCase?: string | null | undefined;
    lastVerified?: string | undefined;
  };
}) {
  const fmt = (d: string | undefined) =>
    d
      ? new Date(d).toLocaleDateString("en-NG", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "—";

  return (
    <div
      className="card"
      style={{
        borderTop: "4px solid var(--c-warning-600)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          background: "var(--c-warning-50)",
          borderBottom: "1px solid var(--c-warning-100)",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--c-warning-700)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: 1 }}
        >
          <path d="M12 2L2 21h20L12 2z" />
          <path d="M12 9v5" />
          <circle cx="12" cy="17.5" r="0.8" fill="currentColor" />
        </svg>
        <div>
          <div
            className="t-h3"
            style={{ color: "var(--c-warning-700)", marginBottom: 2 }}
          >
            Active dispute on file
          </div>
          <div className="t-small" style={{ color: "var(--c-warning-700)" }}>
            Do not proceed with any transaction. This title is under review.
          </div>
        </div>
      </div>
      <div className="card-pad-lg">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <StatusBadge kind="warning">Disputed</StatusBadge>
          <div className="t-small muted">Flagged {fmt(data?.lastVerified)}</div>
        </div>
        <div className="t-micro" style={{ marginBottom: 6 }}>
          Title Reference
        </div>
        <div
          className="t-mono"
          style={{
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "var(--c-ink-1000)",
            marginBottom: 24,
          }}
        >
          {data?.titleRef}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            paddingTop: 20,
            borderTop: "1px solid var(--c-ink-100)",
          }}
        >
          <div>
            <div className="t-micro">Jurisdiction</div>
            <div className="t-h3" style={{ marginTop: 4 }}>
              {data?.jurisdictionState} Registry
            </div>
          </div>
          <div>
            <div className="t-micro">Registered on</div>
            <div className="t-h3" style={{ marginTop: 4 }}>
              {fmt(data?.registrationDate)}
            </div>
          </div>
          <div>
            <div className="t-micro">Dispute case</div>
            <div style={{ marginTop: 4 }}>
              <span
                className="t-mono t-h3"
                style={{ color: "var(--c-warning-700)" }}
              >
                {data?.disputeCase}
              </span>
            </div>
          </div>
          <div>
            <div className="t-micro">Status</div>
            <div className="t-h3" style={{ marginTop: 4 }}>
              Under review
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button className="btn btn-secondary btn-sm">
            View public dispute notice
          </button>
          <button className="btn btn-ghost btn-sm">
            Report incorrect flag
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultNotFound({ searched }: { searched: string }) {
  return (
    <div className="card card-pad-lg" style={{ textAlign: "center" }}>
      <div
        style={{
          width: 72,
          height: 72,
          margin: "8px auto 18px",
          borderRadius: "50%",
          background: "var(--c-ink-50)",
          border: "1px dashed var(--c-ink-300)",
          display: "grid",
          placeItems: "center",
          color: "var(--c-ink-500)",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="6" />
          <path d="M21 21l-5.5-5.5" />
          <path d="M9 11h4" />
        </svg>
      </div>
      <div className="t-h2" style={{ marginBottom: 8 }}>
        No record found
      </div>
      <div
        className="t-body muted"
        style={{ maxWidth: 380, margin: "0 auto 18px" }}
      >
        This title may be unregistered, or the reference number may be
        incorrect. Please double-check and try again.
      </div>
      <div
        style={{
          display: "inline-flex",
          padding: "10px 14px",
          background: "var(--c-ink-50)",
          border: "1px solid var(--c-ink-200)",
          borderRadius: "var(--r-sm)",
          gap: 10,
          alignItems: "center",
        }}
      >
        <span className="t-micro">You searched</span>
        <span className="t-mono" style={{ fontSize: 13, fontWeight: 600 }}>
          {searched}
        </span>
      </div>
      <div className="t-small muted" style={{ marginTop: 18 }}>
        Format must be{" "}
        <span className="t-mono" style={{ color: "var(--c-ink-900)" }}>
          STATE-YEAR-NNNNN
        </span>
        , e.g.{" "}
        <span className="t-mono" style={{ color: "var(--c-ink-900)" }}>
          LAGOS-2024-00142
        </span>
      </div>
    </div>
  );
}

// ── How-it-works steps ──────────────────────────────────────
const HOW_STEPS = [
  {
    n: "01",
    t: "Search",
    d: "Enter the title reference number from the seller's documents.",
    icon: "M11 4a7 7 0 105.196 11.804M21 21l-5-5",
  },
  {
    n: "02",
    t: "Verify",
    d: "We return the title's status, jurisdiction, and any active disputes.",
    icon: "M5 12l4 4 10-10",
  },
  {
    n: "03",
    t: "Transact safely",
    d: "Only proceed with titles marked Registered and free of disputes.",
    icon: "M5 8a3 3 0 013-3h8a3 3 0 013 3v8a3 3 0 01-3 3H8a3 3 0 01-3-3V8z M9 12h6",
  },
];

const FOOTER_LINKS = [
  ["Service", ["Verify a title", "How it works", "Coverage by state"]],
  ["Legal", ["NDPA 2023 notice", "Terms of use", "Accessibility"]],
  [
    "Officials",
    ["Registrar portal →", "API for institutions", "Contact your registry"],
  ],
] as const;

// ── Main page ───────────────────────────────────────────────
export function VerifyPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data, isFetching, isError } = useQuery({
    queryKey: ["verify", submitted],
    queryFn: () => verifyTitle(submitted),
    enabled: !!submitted,
    retry: false,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSubmitted(query.trim().toUpperCase());
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--c-paper)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Gov bar */}
      <div
        style={{
          background: "var(--c-blue-900)",
          padding: "8px 56px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Federal />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 12,
            color: "rgba(226,236,245,0.7)",
          }}
        >
          <span>EN</span>
          <span>·</span>
          <span>HA</span>
          <span>·</span>
          <span>YO</span>
          <span>·</span>
          <span>IG</span>
        </div>
      </div>
      <div className="pattern-strip" />

      {/* Nav */}
      <nav
        style={{
          padding: "20px 56px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--c-card)",
          borderBottom: "1px solid var(--c-ink-200)",
        }}
      >
        <Logo size={42} />
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a
            className="t-small"
            style={{
              color: "var(--c-ink-800)",
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            Verify
          </a>
          <a
            className="t-small"
            style={{
              color: "var(--c-ink-700)",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            How it works
          </a>
          <a
            className="t-small"
            style={{
              color: "var(--c-ink-700)",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            About CLIS
          </a>
          <a
            className="t-small"
            style={{
              color: "var(--c-ink-700)",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            Help
          </a>
          <Link to="/admin/login" className="btn btn-secondary btn-sm">
            Officials' portal →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          padding: "72px 56px 48px",
          maxWidth: 920,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 18,
          }}
        >
          <span className="badge badge-info">
            <span className="badge-dot" />
            Public service · Free
          </span>
          <span className="t-small muted">No account required</span>
        </div>
        <h1 className="t-display" style={{ marginBottom: 14 }}>
          Verify land ownership in seconds.
        </h1>
        <p
          className="t-body"
          style={{
            fontSize: 18,
            color: "var(--c-ink-700)",
            maxWidth: 640,
            marginBottom: 36,
          }}
        >
          Search the national land title registry to confirm any property's
          registration status before you buy, sell, or develop.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: 10, marginBottom: 14 }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--c-ink-500)"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                position: "absolute",
                left: 18,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-5-5" />
            </svg>
            <input
              className="input input-lg t-mono"
              placeholder="STATE-YEAR-NNNNN  e.g. LAGOS-2024-00142"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: 50, fontSize: 16, height: 60 }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isFetching || !query.trim()}
          >
            {isFetching ? "Verifying…" : "Verify title"}
          </button>
        </form>
        <div className="t-small muted">
          Searches are anonymous and do not display owner identity, in
          compliance with NDPA 2023.
        </div>
      </section>

      {/* Result */}
      {(data || isError) && (
        <section
          style={{
            padding: "0 56px 64px",
            maxWidth: 720,
            width: "100%",
            margin: "0 auto",
          }}
        >
          {isError ? (
            <div className="card card-pad-lg" style={{ textAlign: "center" }}>
              <div
                className="t-h3"
                style={{ color: "var(--c-danger-700)", marginBottom: 8 }}
              >
                Could not reach the registry
              </div>
              <div className="t-small muted">
                Please check your connection and try again.
              </div>
            </div>
          ) : data?.found === false ? (
            <ResultNotFound searched={data.searched ?? submitted} />
          ) : data?.status === "disputed" ? (
            <ResultDisputed data={data} />
          ) : (
            <ResultRegistered data={data!} />
          )}
        </section>
      )}

      {/* How it works */}
      <section
        style={{
          padding: "56px 56px 80px",
          background: "var(--c-ink-50)",
          borderTop: "1px solid var(--c-ink-200)",
          marginTop: "auto",
        }}
      >
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div
            className="t-micro"
            style={{ color: "var(--c-blue-700)", marginBottom: 8 }}
          >
            How it works
          </div>
          <h2 className="t-h1" style={{ marginBottom: 36 }}>
            Three steps to safer transactions.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 24,
            }}
          >
            {HOW_STEPS.map((s) => (
              <div
                key={s.n}
                className="card card-pad-md"
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    className="t-mono"
                    style={{
                      fontSize: 12,
                      color: "var(--c-gold-700)",
                      fontWeight: 600,
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--r-sm)",
                      background: "var(--c-blue-50)",
                      color: "var(--c-blue-700)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
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
                      <path d={s.icon} />
                    </svg>
                  </div>
                </div>
                <div className="t-h2" style={{ fontSize: 20 }}>
                  {s.t}
                </div>
                <div className="t-small muted">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: "var(--c-blue-900)",
          color: "rgba(226,236,245,0.7)",
          padding: "40px 56px 28px",
        }}
      >
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 28,
            }}
          >
            <div style={{ maxWidth: 380 }}>
              <Logo size={36} light />
              <div
                className="t-small"
                style={{ marginTop: 14, color: "rgba(226,236,245,0.55)" }}
              >
                A unified land title registry operated by the Federal Ministry
                of Housing & Urban Development in partnership with state
                registries.
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 160px)",
                gap: 24,
              }}
            >
              {FOOTER_LINKS.map(([h, items]) => (
                <div key={h}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fff",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 12,
                    }}
                  >
                    {h}
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {items.map((it) => (
                      <a
                        key={it}
                        className="t-small"
                        style={{
                          color: "rgba(226,236,245,0.65)",
                          textDecoration: "none",
                          cursor: "pointer",
                        }}
                      >
                        {it}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "rgba(226,236,245,0.5)",
            }}
          >
            <div>© 2026 Federal Republic of Nigeria · CLIS Nigeria</div>
            <div>Compliant with the Nigeria Data Protection Act, 2023</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
