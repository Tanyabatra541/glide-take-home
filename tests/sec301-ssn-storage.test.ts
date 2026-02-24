import { beforeEach, describe, it, expect } from "vitest";
import { appRouter } from "@/server/routers";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

describe("SEC-301 - SSN storage", () => {
  beforeEach(async () => {
    // Ensure a clean slate for each test run
    await db.run(sql`PRAGMA foreign_keys = OFF`);
    await db.delete(sessions);
    await db.delete(users);
  });

  it("does not store SSNs in plaintext in the database", async () => {
    const plainSsn = "123456789";
    const email = "sec301-user@example.com";

    const caller = appRouter.createCaller({
      user: null,
      // We don't need real HTTP objects here; auth.signup only cares that these
      // have the methods it uses for headers/cookies. Provide just enough shape
      // to avoid foreign key / response type issues.
      req: { headers: {} },
      res: {
        setHeader: () => {},
      },
    } as any);

    await caller.auth.signup({
      email,
      password: "StrongPass123!",
      firstName: "Sec",
      lastName: "User",
      phoneNumber: "+15555550123",
      dateOfBirth: "1990-01-01",
      ssn: plainSsn,
      address: "123 Main St",
      city: "Testville",
      state: "CA",
      zipCode: "94105",
    });

    const user = await db.select().from(users).where(eq(users.email, "sec301-user@example.com")).get();
    if (!user) {
      throw new Error("Failed to create user for SEC-301 test");
    }

    // SSN should be stored, but not as the original plaintext value
    expect(user.ssn).toBeDefined();
    expect(user.ssn).not.toBe(plainSsn);
    // Encrypted SSN should look like opaque base64 data with different length
    expect(typeof user.ssn).toBe("string");
    expect(user.ssn.length).toBeGreaterThan(plainSsn.length);
  });
});

