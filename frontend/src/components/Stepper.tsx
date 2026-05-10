interface StepperProps {
  step: number;
}

const STEPS = [
  [1, "Owner Details"],
  [2, "Parcel Details"],
  [3, "Review & Submit"],
] as const;

export function Stepper({ step }: StepperProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 28,
      }}
    >
      {STEPS.map(([n, label], i) => (
        <div
          key={n}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            flex: i < 2 ? undefined : undefined,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background:
                  step > n
                    ? "var(--c-success-600)"
                    : step === n
                      ? "var(--c-blue-700)"
                      : "var(--c-ink-200)",
                color: step >= n ? "#fff" : "var(--c-ink-600)",
                display: "grid",
                placeItems: "center",
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {step > n ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <path d="M5 12l4 4 10-10" />
                </svg>
              ) : (
                n
              )}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: step === n ? 600 : 500,
                color: step === n ? "var(--c-ink-1000)" : "var(--c-ink-600)",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </div>
          </div>
          {i < 2 && (
            <div
              style={{
                flex: 1,
                height: 1,
                minWidth: 32,
                background:
                  step > n ? "var(--c-success-600)" : "var(--c-ink-200)",
                margin: "0 8px",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
