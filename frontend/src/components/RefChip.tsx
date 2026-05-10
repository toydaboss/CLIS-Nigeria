import { useState } from "react";

interface RefChipProps {
  value: string;
  copyFn?: (value: string) => Promise<void>;
}

export function RefChip({
  value,
  copyFn = (text) => navigator.clipboard.writeText(text),
}: RefChipProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    copyFn(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div>
      <span className="ref-chip t-mono">
        {value}
        <button
          className="ref-chip-copy"
          title={copied ? "Copied!" : "Copy"}
          onClick={copy}
          type="button"
        >
          {copied ? (
            <svg
              width="12"
              height="12"
              viewBox="0 0 14 14"
              fill="none"
              stroke="var(--c-success-600)"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M2 7l3.5 3.5L12 3" />
            </svg>
          ) : (
            <svg
              width="12"
              height="12"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="4" y="4" width="8" height="8" rx="1.2" />
              <path d="M9 4V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1" />
            </svg>
          )}
        </button>
      </span>
    </div>
  );
}
