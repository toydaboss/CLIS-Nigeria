type BadgeKind = "success" | "warning" | "danger" | "neutral" | "info" | "gold";

interface StatusBadgeProps {
  kind: BadgeKind;
  children: React.ReactNode;
  small?: boolean;
}

export function StatusBadge({ kind, children, small }: StatusBadgeProps) {
  return (
    <span
      className={`badge badge-${kind}`}
      style={small ? { height: 22, fontSize: 10 } : undefined}
    >
      <span className="badge-dot" />
      {children}
    </span>
  );
}

export function statusToKind(status: string): BadgeKind {
  switch (status) {
    case "registered":
      return "success";
    case "disputed":
      return "warning";
    case "revoked":
      return "danger";
    case "pending":
      return "neutral";
    default:
      return "neutral";
  }
}
