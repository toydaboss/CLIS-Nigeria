import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after every test
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

// Stub matchMedia (not available in jsdom)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// jsdom 29 defines Navigator.prototype.clipboard as a getter.
// Override it at the prototype level so all navigator instances return our mock.
const clipboardMock = { writeText: vi.fn().mockResolvedValue(undefined) };
Object.defineProperty(Navigator.prototype, "clipboard", {
  get: () => clipboardMock,
  configurable: true,
});
