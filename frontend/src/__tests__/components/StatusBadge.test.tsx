import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StatusBadge, statusToKind } from "../../components/StatusBadges";

describe("StatusBadge rendering", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders children text", () => {
    render(<StatusBadge kind="success">Registered</StatusBadge>);
    expect(screen.getByText("Registered")).toBeInTheDocument();
  });

  it("applies badge-success class for success kind", () => {
    const { container } = render(<StatusBadge kind="success">OK</StatusBadge>);
    expect(container.firstChild).toHaveClass("badge-success");
  });

  it("applies badge-warning class for warning kind", () => {
    const { container } = render(
      <StatusBadge kind="warning">Disputed</StatusBadge>,
    );
    expect(container.firstChild).toHaveClass("badge-warning");
  });

  it("applies badge-danger class for danger kind", () => {
    const { container } = render(
      <StatusBadge kind="danger">Revoked</StatusBadge>,
    );
    expect(container.firstChild).toHaveClass("badge-danger");
  });

  it("applies badge-neutral class for neutral kind", () => {
    const { container } = render(
      <StatusBadge kind="neutral">Pending</StatusBadge>,
    );
    expect(container.firstChild).toHaveClass("badge-neutral");
  });

  it("applies badge-info class for info kind", () => {
    const { container } = render(<StatusBadge kind="info">Info</StatusBadge>);
    expect(container.firstChild).toHaveClass("badge-info");
  });

  it("applies badge-gold class for gold kind", () => {
    const { container } = render(
      <StatusBadge kind="gold">Official</StatusBadge>,
    );
    expect(container.firstChild).toHaveClass("badge-gold");
  });

  it("always renders the dot element", () => {
    const { container } = render(<StatusBadge kind="success">x</StatusBadge>);
    const dot = container.querySelector(".badge-dot");
    expect(dot).toBeInTheDocument();
  });

  it("reduces height when small prop is set", () => {
    const { container } = render(
      <StatusBadge kind="neutral" small>
        x
      </StatusBadge>,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.height).toBe("22px");
  });
});

describe("statusToKind", () => {
  it.each([
    ["registered", "success"],
    ["disputed", "warning"],
    ["revoked", "danger"],
    ["pending", "neutral"],
  ] as const)('maps "%s" → "%s"', (status, expected) => {
    expect(statusToKind(status)).toBe(expected);
  });

  it("maps unknown status to neutral", () => {
    expect(statusToKind("unknown")).toBe("neutral");
    expect(statusToKind("")).toBe("neutral");
  });

  it("is case-sensitive (uppercase does not match)", () => {
    expect(statusToKind("REGISTERED")).toBe("neutral");
  });
});
