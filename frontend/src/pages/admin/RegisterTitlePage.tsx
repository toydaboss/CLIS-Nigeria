import { AdminLayout } from "@/components/AdminLayout";
import { Stepper } from "@/components/Stepper";
import { registerTitle } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";

// ── Form state ─────────────────────────────────────────────
interface FormData {
  ownerNinLast4: string;
  ownerNameMasked: string;
  jurisdictionState: string;
  lga: string;
  titleRef: string;
  latitude: string;
  longitude: string;
  documentRef: string;
  registrationDate: string;
  confirmed: boolean;
}

const INITIAL: FormData = {
  ownerNinLast4: "1234",
  ownerNameMasked: "ADE•••••• ••••••",
  jurisdictionState: "Lagos",
  lga: "Ikeja",
  titleRef: "LAGOS-2026-04194",
  latitude: "6.5244",
  longitude: "3.3792",
  documentRef: "LSR/IKJ/2026/A-04194",
  registrationDate: new Date().toISOString().slice(0, 10),
  confirmed: false,
};

// ── Step 1 ─────────────────────────────────────────────────
function Step1({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (k: keyof FormData, v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">
            Owner NIN{" "}
            <span
              className="badge badge-neutral"
              style={{ height: 18, fontSize: 9, padding: "0 6px" }}
            >
              NDPA · Masked
            </span>
          </label>
          <input
            className="input t-mono"
            value={`***-****-${data.ownerNinLast4}`}
            onChange={(e) => {
              const last4 = e.target.value.slice(-4).replace(/\D/g, "");
              onChange("ownerNinLast4", last4);
            }}
          />
          <div className="field-hint">
            Full NIN is encrypted at rest. Only last 4 digits display.
          </div>
        </div>
        <div className="field">
          <label className="field-label">Owner Name (partial)</label>
          <input
            className="input"
            value={data.ownerNameMasked}
            onChange={(e) => onChange("ownerNameMasked", e.target.value)}
          />
          <div className="field-hint">
            First 3 characters only — per NDPA 2023.
          </div>
        </div>
      </div>
      <div className="field">
        <label className="field-label">Jurisdiction State</label>
        <select
          className="input select"
          value={data.jurisdictionState}
          onChange={(e) => onChange("jurisdictionState", e.target.value)}
        >
          {["Lagos", "FCT Abuja", "Kano", "Rivers", "Oyo", "Kaduna"].map(
            (s) => (
              <option key={s} value={s}>
                {s} State
              </option>
            ),
          )}
        </select>
      </div>
      <div className="field">
        <label className="field-label">Local Government Area</label>
        <select
          className="input select"
          value={data.lga}
          onChange={(e) => onChange("lga", e.target.value)}
        >
          {[
            "Ikeja",
            "Eti-Osa",
            "Ikorodu",
            "Lagos Mainland",
            "Surulere",
            "Agege",
          ].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── Map placeholder ─────────────────────────────────────────
function MapPlaceholder({ lat, lng }: { lat: string; lng: string }) {
  return (
    <div
      style={{
        height: 220,
        borderRadius: "var(--r-md)",
        border: "1px solid var(--c-ink-200)",
        overflow: "hidden",
        position: "relative",
        background: `
        radial-gradient(circle at 30% 40%, rgba(31,78,121,0.08), transparent 50%),
        radial-gradient(circle at 70% 70%, rgba(201,168,76,0.08), transparent 50%),
        repeating-linear-gradient(0deg, var(--c-ink-100) 0 1px, transparent 1px 32px),
        repeating-linear-gradient(90deg, var(--c-ink-100) 0 1px, transparent 1px 32px),
        var(--c-ink-50)
      `,
      }}
    >
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
        viewBox="0 0 600 220"
        preserveAspectRatio="none"
      >
        <path
          d="M0,140 Q150,100 280,130 T600,110 L600,220 L0,220 Z"
          fill="rgba(31,78,121,0.06)"
        />
        <path
          d="M40,180 L120,150 L220,170 L320,140 L460,160 L560,130"
          stroke="var(--c-ink-300)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="4 3"
        />
        <path
          d="M220,80 L300,60 L380,90 L370,140 L290,150 L210,130 Z"
          fill="rgba(201,168,76,0.18)"
          stroke="var(--c-gold-600)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -100%)",
        }}
      >
        <svg width="28" height="36" viewBox="0 0 28 36">
          <path
            d="M14 0C6.3 0 0 6.3 0 14c0 10 14 22 14 22s14-12 14-22C28 6.3 21.7 0 14 0z"
            fill="var(--c-danger-600)"
          />
          <circle cx="14" cy="14" r="5" fill="#fff" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          padding: "6px 10px",
          background: "rgba(255,255,255,0.94)",
          borderRadius: "var(--r-sm)",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--c-ink-800)",
          display: "flex",
          gap: 6,
          alignItems: "center",
          boxShadow: "var(--sh-xs)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--c-gold-500)",
          }}
        />
        Selected parcel · ~0.42 ha
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          padding: "6px 10px",
          background: "rgba(255,255,255,0.94)",
          borderRadius: "var(--r-sm)",
          fontSize: 11,
          fontFamily: "var(--f-mono)",
          color: "var(--c-ink-700)",
          boxShadow: "var(--sh-xs)",
        }}
      >
        {lat}° N, {lng}° E
      </div>
    </div>
  );
}

// ── Step 2 ─────────────────────────────────────────────────
function Step2({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (k: keyof FormData, v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="field">
        <label className="field-label">Title Reference Number</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            className="input t-mono"
            value={data.titleRef}
            onChange={(e) => onChange("titleRef", e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="button" className="btn btn-secondary btn-sm">
            Regenerate
          </button>
        </div>
        <div className="field-hint">
          Auto-generated from State + Year + sequence. Editable by registrars
          only.
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">Latitude</label>
          <input
            className="input t-mono"
            value={data.latitude}
            onChange={(e) => onChange("latitude", e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label">Longitude</label>
          <input
            className="input t-mono"
            value={data.longitude}
            onChange={(e) => onChange("longitude", e.target.value)}
          />
        </div>
      </div>
      <MapPlaceholder lat={data.latitude} lng={data.longitude} />
      <div className="grid-2">
        <div className="field">
          <label className="field-label">
            Document Reference (physical archive ID)
          </label>
          <input
            className="input t-mono"
            value={data.documentRef}
            onChange={(e) => onChange("documentRef", e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label">Registration Date</label>
          <input
            className="input"
            type="date"
            value={data.registrationDate}
            onChange={(e) => onChange("registrationDate", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 3 ─────────────────────────────────────────────────
function Step3({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (k: keyof FormData, v: string | boolean) => void;
}) {
  const SUM_FIELDS: Array<[string, React.ReactNode]> = [
    [
      "Title Reference",
      <span className="t-mono" style={{ fontSize: 14, fontWeight: 600 }}>
        {data.titleRef}
      </span>,
    ],
    [
      "Owner NIN",
      <span className="t-mono">***-****-{data.ownerNinLast4}</span>,
    ],
    ["Owner Name", <span className="t-mono">{data.ownerNameMasked}</span>],
    ["Jurisdiction", `${data.jurisdictionState} · ${data.lga} LGA`],
    [
      "Coordinates",
      <span className="t-mono">
        {data.latitude}° N, {data.longitude}° E
      </span>,
    ],
    ["Doc. Reference", <span className="t-mono">{data.documentRef}</span>],
    [
      "Registration Date",
      new Date(data.registrationDate).toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    ],
    ["Registered by", <span className="t-mono">USR-LSR-0241</span>],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Conflict warning */}
      <div
        style={{
          display: "flex",
          gap: 14,
          padding: "16px 18px",
          background: "var(--c-warning-50)",
          border: "1px solid var(--c-warning-100)",
          borderLeft: "4px solid var(--c-warning-600)",
          borderRadius: "var(--r-sm)",
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
        <div style={{ flex: 1 }}>
          <div
            className="t-h3"
            style={{ color: "var(--c-warning-700)", marginBottom: 4 }}
          >
            Possible parcel overlap detected
          </div>
          <div
            className="t-small"
            style={{ color: "var(--c-warning-700)", marginBottom: 10 }}
          >
            The boundary you submitted is within 18 m of{" "}
            <span className="t-mono" style={{ fontWeight: 600 }}>
              LAGOS-2024-00142
            </span>{" "}
            (registered 14 Mar 2024). Review the boundary or confirm this is a
            sub-parcel before submitting.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm">
              View overlap on map
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--c-warning-700)" }}
            >
              Acknowledge & continue
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--c-ink-100)",
          }}
        >
          <div className="t-h3">Summary</div>
        </div>
        <div
          style={{
            padding: 24,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px 32px",
          }}
        >
          {SUM_FIELDS.map(([l, v]) => (
            <div key={l}>
              <div className="t-micro" style={{ marginBottom: 4 }}>
                {l}
              </div>
              <div style={{ fontSize: 14, color: "var(--c-ink-1000)" }}>
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 16,
          border: "1px solid var(--c-ink-200)",
          borderRadius: "var(--r-sm)",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            border: `1.5px solid ${data.confirmed ? "var(--c-blue-700)" : "var(--c-ink-300)"}`,
            background: data.confirmed ? "var(--c-blue-700)" : "transparent",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {data.confirmed && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <path d="M5 12l4 4 10-10" />
            </svg>
          )}
        </span>
        <input
          type="checkbox"
          checked={data.confirmed}
          onChange={(e) => onChange("confirmed", e.target.checked)}
          style={{ display: "none" }}
        />
        <span className="t-small">
          I confirm the information above is accurate, and that supporting
          physical documents are archived under the stated reference. This
          action will be logged.
        </span>
      </label>
    </div>
  );
}

// ── Success ─────────────────────────────────────────────────
function StepSuccess({
  titleRef,
  onReset,
}: {
  titleRef: string;
  onReset: () => void;
}) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(titleRef).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{ maxWidth: 560, margin: "60px auto", textAlign: "center" }}>
      <div
        style={{
          width: 80,
          height: 80,
          margin: "0 auto 22px",
          borderRadius: "50%",
          background: "var(--c-success-50)",
          border: "1px solid var(--c-success-100)",
          display: "grid",
          placeItems: "center",
          color: "var(--c-success-600)",
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12l4 4 10-10" />
        </svg>
      </div>
      <div className="t-h1" style={{ marginBottom: 8 }}>
        Title registered successfully
      </div>
      <div className="t-body muted" style={{ marginBottom: 28 }}>
        The title is now searchable in the public verification portal.
      </div>

      <div
        className="card card-pad-lg"
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          minWidth: 380,
        }}
      >
        <div className="t-micro">New Title Reference</div>
        <div
          className="t-mono"
          style={{
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "var(--c-ink-1000)",
          }}
        >
          {titleRef}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={copy}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15V5a2 2 0 012-2h10" />
          </svg>
          {copied ? "Copied!" : "Copy reference"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          marginTop: 28,
        }}
      >
        <button
          className="btn btn-secondary"
          onClick={() => navigate({ to: "/admin/lookup" })}
        >
          View certificate
        </button>
        <button className="btn btn-primary" onClick={onReset}>
          Register another
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export function RegisterTitlePage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [registeredRef, setRegisteredRef] = useState("");

  const onChange = (k: keyof FormData, v: string | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const mutation = useMutation({
    mutationFn: () =>
      registerTitle({
        titleRef: form.titleRef,
        ownerNinLast4: form.ownerNinLast4,
        ownerNameMasked: form.ownerNameMasked,
        jurisdictionState: form.jurisdictionState,
        lga: form.lga,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        documentRef: form.documentRef,
        registrationDate: form.registrationDate,
      }),
    onSuccess: (data) => {
      setRegisteredRef((data.title as { title_ref: string }).title_ref);
      setStep(4);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    mutation.mutate();
  };

  const handleReset = () => {
    setForm(INITIAL);
    setStep(1);
    setRegisteredRef("");
  };

  return (
    <AdminLayout active="Register Title">
      <div className="page-pad" style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              className="t-micro"
              style={{ color: "var(--c-blue-700)", marginBottom: 4 }}
            >
              New Registration
            </div>
            <h1 className="t-h1">Register a new land title</h1>
          </div>
          {step !== 4 && (
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm">
                Save draft
              </button>
              <button type="button" className="btn btn-secondary btn-sm">
                Cancel
              </button>
            </div>
          )}
        </div>

        {step === 4 ? (
          <StepSuccess
            titleRef={registeredRef || form.titleRef}
            onReset={handleReset}
          />
        ) : (
          <form onSubmit={handleSubmit}>
            <Stepper step={step} />

            {step === 1 && <Step1 data={form} onChange={onChange} />}
            {step === 2 && <Step2 data={form} onChange={onChange} />}
            {step === 3 && (
              <Step3
                data={form}
                onChange={(k, v) => onChange(k as keyof FormData, v)}
              />
            )}

            {mutation.isError && (
              <div
                className="t-small"
                style={{
                  color: "var(--c-danger-700)",
                  marginTop: 16,
                  padding: "10px 14px",
                  background: "var(--c-danger-50)",
                  borderRadius: "var(--r-sm)",
                  border: "1px solid var(--c-danger-100)",
                }}
              >
                Registration failed. Please check the form and try again.
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 32,
                paddingTop: 20,
                borderTop: "1px solid var(--c-ink-200)",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                disabled={step === 1}
                onClick={() => setStep((s) => s - 1)}
              >
                ← Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={(step === 3 && !form.confirmed) || mutation.isPending}
              >
                {mutation.isPending
                  ? "Submitting…"
                  : step === 3
                    ? "Submit registration"
                    : "Continue →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
