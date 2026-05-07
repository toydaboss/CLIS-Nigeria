interface LogoProps {
  size?: number;
  light?: boolean;
}

export function Logo({ size = 36, light = false }: LogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        className="clis-mark"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 22 22"
          fill="none"
        >
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
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: light ? "#fff" : "var(--c-ink-1000)",
            lineHeight: 1,
          }}
        >
          CLIS
        </div>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: light ? "var(--c-gold-300)" : "var(--c-ink-600)",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          Nigeria · Land Registry
        </div>
      </div>
    </div>
  );
}
