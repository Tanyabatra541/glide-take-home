import { beforeEach, describe, it, expect } from "vitest";
import { eq, sql } from "drizzle-orm";

import { appRouter } from "@/server/routers";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";

describe("VAL-202 - date of birth validation", () => {
  beforeEach(async () => {
    // Ensure a clean slate for each test run
    await db.run(sql`PRAGMA foreign_keys = OFF`);
    await db.delete(sessions);
    await db.delete(users);
  });

  const createCaller = () =>
    appRouter.createCaller({
      user: null,
      req: { headers: {} },
      res: {
        setHeader: () => {},
      },
    } as any);

  const baseSignupData = {
    email: "val202-user@example.com",
    password: "StrongPass123!",
    firstName: "Val",
    lastName: "User",
    phoneNumber: "+15555550123",
    ssn: "123456789",
    address: "123 Main St",
    city: "Testville",
    state: "CA",
    zipCode: "94105",
  };

  it("rejects a date of birth in the future", async () => {
    const caller = createCaller();
    const today = new Date();
    const futureYear = today.getFullYear() + 1;
    const futureDob = `${futureYear}-01-01`;

    await expect(
      caller.auth.signup({
        ...baseSignupData,
        email: "val202-future@example.com",
        dateOfBirth: futureDob,
      })
    ).rejects.toBeInstanceOf(Error);
  });

  it("rejects a user who is under 18 years old", async () => {
    const caller = createCaller();
    const today = new Date();
    const underageYear = today.getFullYear() - 10;
    const underageDob = `${underageYear}-01-01`;

    await expect(
      caller.auth.signup({
        ...baseSignupData,
        email: "val202-underage@example.com",
        dateOfBirth: underageDob,
      })
    ).rejects.toBeInstanceOf(Error);
  });

  it("accepts a valid adult date of birth", async () => {
    const caller = createCaller();
    const adultDob = "1990-01-01";

    await expect(
      caller.auth.signup({
        ...baseSignupData,
        email: "val202-valid@example.com",
        dateOfBirth: adultDob,
      })
    ).resolves.toBeDefined();

    const user = await db.select().from(users).where(eq(users.email, "val202-valid@example.com")).get();
    expect(user).toBeDefined();
    expect(user?.dateOfBirth).toBe(adultDob);
  });
});

