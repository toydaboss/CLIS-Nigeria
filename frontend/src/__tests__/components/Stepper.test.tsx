import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Stepper } from "../../components/Stepper";

const STEP_LABELS = ["Owner Details", "Parcel Details", "Review & Submit"];

describe("Stepper", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders all three step labels", () => {
    render(<Stepper step={1} />);
    STEP_LABELS.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("shows the current step number (not a checkmark) for step 1", () => {
    render(<Stepper step={1} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows step numbers 2 and 3 as pending when step=1", () => {
    render(<Stepper step={1} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows checkmark SVG for completed step when on step 2", () => {
    const { container } = render(<Stepper step={2} />);
    // Step 1 is completed → its circle contains an SVG path, not "1"
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    // Step 2 is current → still shows "2"
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows checkmarks for steps 1 and 2 when on step 3", () => {
    render(<Stepper step={3} />);
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("applies primary background to current step indicator", () => {
    const { container } = render(<Stepper step={2} />);
    // The current step circle should have the blue-700 background
    const circles = container.querySelectorAll(
      'div[style*="border-radius: 50%"]',
    );
    // Find the one with blue background
    const currentCircle = Array.from(circles).find((el) =>
      (el as HTMLElement).style.background.includes("var(--c-blue-700)"),
    );
    expect(currentCircle).toBeDefined();
  });

  it("applies success background to completed step indicators", () => {
    const { container } = render(<Stepper step={3} />);
    const circles = container.querySelectorAll(
      'div[style*="border-radius: 50%"]',
    );
    const completedCircles = Array.from(circles).filter((el) =>
      (el as HTMLElement).style.background.includes("var(--c-success-600)"),
    );
    // Steps 1 and 2 should be completed (success colour)
    expect(completedCircles.length).toBe(2);
  });

  it("applies bolder font weight to the active step label", () => {
    const { container } = render(<Stepper step={2} />);
    const parcelLabel = screen.getByText("Parcel Details");
    expect(parcelLabel).toHaveStyle({ fontWeight: "600" });
  });

  it("renders connector lines between steps", () => {
    const { container } = render(<Stepper step={1} />);
    // Two connector lines between three steps
    const connectors = container.querySelectorAll('div[style*="height: 1px"]');
    expect(connectors.length).toBe(2);
  });

  it("connector line before current step is success colour when step > 1", () => {
    const { container } = render(<Stepper step={2} />);
    const connectors = Array.from(
      container.querySelectorAll('div[style*="height: 1px"]'),
    );
    const firstConnector = connectors[0] as HTMLElement;
    expect(firstConnector.style.background).toContain("var(--c-success-600)");
  });
});
