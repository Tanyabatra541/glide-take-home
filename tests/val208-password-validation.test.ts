import { beforeEach, describe, it, expect } from "vitest";
import { eq, sql } from "drizzle-orm";

import { appRouter } from "@/server/routers";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";

describe("VAL-208 - password complexity", () => {
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

  const baseUserData = {
    firstName: "Val",
    lastName: "User",
    phoneNumber: "+15555550199",
    dateOfBirth: "1990-01-01",
    ssn: "123456789",
    address: "123 Main St",
    city: "Testville",
    state: "CA",
    zipCode: "94105",
  };

  it("accepts a password that meets all complexity requirements", async () => {
    const email = "val208-strong@example.com";
    const caller = createCaller();

    await caller.auth.signup({
      email,
      password: "Strong1!",
      ...baseUserData,
    });

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    expect(user).toBeDefined();
  });

  it("rejects passwords that are too short", async () => {
    const email = "val208-short@example.com";
    const caller = createCaller();

    await expect(
      caller.auth.signup({
        email,
        password: "S1!",
        ...baseUserData,
      })
    ).rejects.toBeInstanceOf(Error);

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    expect(user).toBeUndefined();
  });

  it("rejects passwords without a digit", async () => {
    const email = "val208-nodigit@example.com";
    const caller = createCaller();

    await expect(
      caller.auth.signup({
        email,
        password: "NoDigits!",
        ...baseUserData,
      })
    ).rejects.toBeInstanceOf(Error);

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    expect(user).toBeUndefined();
  });

  it("rejects passwords without a special character", async () => {
    const email = "val208-nospecial@example.com";
    const caller = createCaller();

    await expect(
      caller.auth.signup({
        email,
        password: "NoSpecial1",
        ...baseUserData,
      })
    ).rejects.toBeInstanceOf(Error);

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    expect(user).toBeUndefined();
  });

  it("rejects common passwords even if other rules would pass", async () => {
    const email = "val208-common@example.com";
    const caller = createCaller();

    await expect(
      caller.auth.signup({
        email,
        password: "password",
        ...baseUserData,
      })
    ).rejects.toBeInstanceOf(Error);

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    expect(user).toBeUndefined();
  });
});

