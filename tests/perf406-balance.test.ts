import { describe, it, expect } from "vitest";
import { normalizeAmount } from "@/server/routers/account";

describe("PERF-406 - balance calculation", () => {
  it("rounds amounts to 2 decimal places", () => {
    expect(normalizeAmount(10)).toBe(10);
    expect(normalizeAmount(10.1)).toBe(10.1);
    expect(normalizeAmount(10.129)).toBe(10.13);
    expect(normalizeAmount(10.124)).toBe(10.12);
  });

  it("keeps balance correct after many small deposits", () => {
    // Simulate many 0.1 deposits and confirm we don't drift
    let balance = 0;

    for (let i = 0; i < 1000; i++) {
      const deposit = normalizeAmount(0.1);
      balance = normalizeAmount(balance + deposit);
    }

    // 1000 * 0.1 = 100.0 exactly when normalized to 2 decimals on each step
    expect(balance).toBe(100);
  });

  it("avoids typical floating point drift seen with raw JS numbers", () => {
    let raw = 0;
    for (let i = 0; i < 1000; i++) {
      raw += 0.1;
    }

    // Demonstrate the typical JS drift (this assertion documents the bug we fixed)
    expect(raw).not.toBe(100);

    // And contrast it with the normalized approach
    let normalized = 0;
    for (let i = 0; i < 1000; i++) {
      normalized = normalizeAmount(normalized + 0.1);
    }

    expect(normalized).toBe(100);
  });
});

