import { Logo } from "@/components/Logo";
import { loginCredentials, loginMfa } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";

function StatsRow() {
  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        paddingTop: 24,
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {[
        ["2.4M", "Titles"],
        ["37", "Registries"],
        ["99.98%", "Uptime"],
      ].map(([v, l]) => (
        <div key={l}>
          <div
            className="t-mono"
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "var(--c-gold-300)",
            }}
          >
            {v}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(226,236,245,0.5)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {l}
          </div>
        </div>
      ))}
    </div>
  );
}

function BrandPanel() {
  return (
    <div
      style={{
        width: 540,
        background: "var(--c-blue-900)",
        color: "#fff",
        padding: "40px 48px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <Logo size={40} light />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0 24px, rgba(201,168,76,0.04) 24px 25px),
                          repeating-linear-gradient(45deg, transparent 0 24px, rgba(201,168,76,0.04) 24px 25px)`,
        }}
      />
      <div style={{ marginTop: "auto", position: "relative" }}>
        <div
          className="pattern-strip"
          style={{ width: 80, marginBottom: 24 }}
        />
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            marginBottom: 16,
            maxWidth: 380,
          }}
        >
          Securing land titles for every Nigerian.
        </div>
        <div
          className="t-body"
          style={{
            color: "rgba(226,236,245,0.7)",
            maxWidth: 380,
            marginBottom: 32,
          }}
        >
          Cloud-Based Centralized Land Information System — operating across 36
          states and the FCT.
        </div>
        <StatsRow />
      </div>
    </div>
  );
}

function SecurityNotice() {
  return (
    <div
      style={{
        marginTop: 32,
        padding: "12px 14px",
        background: "var(--c-warning-50)",
        border: "1px solid var(--c-warning-100)",
        borderRadius: "var(--r-sm)",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--c-warning-700)"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ flexShrink: 0, marginTop: 2 }}
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
      <div
        className="t-small"
        style={{ color: "var(--c-warning-700)", fontSize: 12 }}
      >
        Access is restricted to authorised government officials. All sessions
        are logged for audit.
      </div>
    </div>
  );
}

// ── Step 1: credentials ─────────────────────────────────────
function CredentialsForm({
  onSuccess,
}: {
  onSuccess: (tempToken: string) => void;
}) {
  const [email, setEmail] = useState("a.bello@lagosstate.gov.ng");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => loginCredentials(email, password),
    onSuccess: (data) => onSuccess(data.tempToken),
    onError: (err: Error & { response?: { data?: { error?: string } } }) => {
      setError(err.response?.data?.error ?? "Invalid credentials");
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate();
  };

  return (
    <>
      <div
        className="t-micro"
        style={{ color: "var(--c-blue-700)", marginBottom: 6 }}
      >
        Step 1 of 2
      </div>
      <h2 className="t-h1" style={{ marginBottom: 8 }}>
        Sign in
      </h2>
      <div className="t-body muted" style={{ marginBottom: 32 }}>
        Use your government-issued credentials.
      </div>

      <form
        className="col"
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
        onSubmit={handleSubmit}
      >
        <div className="field">
          <label className="field-label">Work email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="field">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label className="field-label">Password</label>
            <a
              className="t-small"
              style={{ color: "var(--c-blue-700)", cursor: "pointer" }}
            >
              Forgot?
            </a>
          </div>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••••••"
            required
          />
        </div>
        {error && (
          <div
            className="t-small"
            style={{
              color: "var(--c-danger-700)",
              padding: "8px 12px",
              background: "var(--c-danger-50)",
              border: "1px solid var(--c-danger-100)",
              borderRadius: "var(--r-sm)",
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block"
          style={{ marginTop: 8 }}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Signing in…" : "Continue"}
        </button>
      </form>
      <SecurityNotice />
    </>
  );
}

// ── Step 2: TOTP MFA ────────────────────────────────────────
function MfaForm({
  tempToken,
  onSuccess,
}: {
  tempToken: string;
  onSuccess: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => loginMfa(tempToken, digits.join("")),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      onSuccess();
      navigate({ to: "/admin/dashboard" });
    },
    onError: (err: Error & { response?: { data?: { error?: string } } }) => {
      setError(err.response?.data?.error ?? "Invalid code");
    },
  });

  const handleDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) {
      const el = document.getElementById(`otp-${i + 1}`);
      el?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const el = document.getElementById(`otp-${i - 1}`);
      el?.focus();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate();
  };

  const code = digits.join("");

  return (
    <>
      <div
        className="t-micro"
        style={{ color: "var(--c-blue-700)", marginBottom: 6 }}
      >
        Step 2 of 2 · MFA
      </div>
      <h2 className="t-h1" style={{ marginBottom: 8 }}>
        Enter authenticator code
      </h2>
      <div className="t-body muted" style={{ marginBottom: 32 }}>
        Open your authenticator app and enter the 6-digit TOTP code for CLIS.
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {digits.map((d, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: 52,
                height: 60,
                border: `1.5px solid ${i === digits.findIndex((x) => !x) && !digits.every((x) => x) ? "var(--c-blue-700)" : "var(--c-ink-300)"}`,
                borderRadius: "var(--r-sm)",
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                fontFamily: "var(--f-mono)",
                fontSize: 26,
                fontWeight: 600,
                color: "var(--c-ink-1000)",
                background: "var(--c-card)",
                boxShadow:
                  i === digits.findIndex((x) => !x) && !digits.every((x) => x)
                    ? "0 0 0 3px rgba(31,78,121,0.18)"
                    : "none",
                outline: "none",
              }}
              autoFocus={i === 0}
              autoComplete="one-time-code"
            />
          ))}
        </div>
        <div className="t-small muted" style={{ marginBottom: 24 }}>
          Code refreshes every 30 seconds
        </div>
        {error && (
          <div
            className="t-small"
            style={{
              color: "var(--c-danger-700)",
              padding: "8px 12px",
              background: "var(--c-danger-50)",
              border: "1px solid var(--c-danger-100)",
              borderRadius: "var(--r-sm)",
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block"
          disabled={code.length < 6 || mutation.isPending}
        >
          {mutation.isPending ? "Verifying…" : "Verify & sign in"}
        </button>
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <a
            className="t-small"
            style={{ color: "var(--c-blue-700)", cursor: "pointer" }}
          >
            Use backup code
          </a>
        </div>
      </form>
      <SecurityNotice />
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────
export function LoginPage() {
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [tempToken, setTempToken] = useState("");

  return (
    <div
      style={{ display: "flex", height: "100vh", background: "var(--c-paper)" }}
    >
      <BrandPanel />

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <div style={{ width: 380 }}>
          {step === "credentials" ? (
            <CredentialsForm
              onSuccess={(token) => {
                setTempToken(token);
                setStep("mfa");
              }}
            />
          ) : (
            <MfaForm tempToken={tempToken} onSuccess={() => {}} />
          )}
        </div>
      </div>
    </div>
  );
}
