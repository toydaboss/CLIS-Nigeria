import { vi } from "vitest";

// Use deterministic secrets so jwt.sign / jwt.verify work across tests
process.env.JWT_SECRET = "test-jwt-secret-at-least-32-chars-long";
process.env.JWT_TEMP_SECRET = "test-temp-secret-at-least-32-chars";

// Silence console.error in tests to keep output clean
vi.spyOn(console, "error").mockImplementation(() => {});
