import { beforeEach,describe, it, expect } from "vitest";
import { appRouter } from "@/server/routers";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

describe("VAL-201 - Email Validation Problems", () => {
    beforeEach(async () => {
      await db.run(sql`PRAGMA foreign_keys = OFF`);
      await db.delete(sessions);
      await db.delete(users);
      await db.run(sql`PRAGMA foreign_keys = ON`);
    });
  
    const caller = appRouter.createCaller({
        req: { headers: {} },
        res: {
        setHeader: () => {},
        },
    } as any);

  it("rejects invalid email formats", async () => {
    await expect(
      caller.auth.signup({
        email: "invalid-email",
        password: "Strong1!",
        firstName: "Test",
        lastName: "User",
        phoneNumber: "+15555555555",
        dateOfBirth: "1990-01-01",
        ssn: "123456789",
        address: "123 Main St",
        city: "Testville",
        state: "CA",
        zipCode: "94105",
      })
    ).rejects.toThrow();
  });

  it("rejects single-letter TLD", async () => {
    await expect(
      caller.auth.signup({
        email: "test@example.d",
        password: "Strong1!",
        firstName: "Test",
        lastName: "User",
        phoneNumber: "+15555555555",
        dateOfBirth: "1990-01-01",
        ssn: "123456789",
        address: "123 Main St",
        city: "Testville",
        state: "CA",
        zipCode: "94105",
      })
    ).rejects.toThrow();
  });

  it("rejects common typo domains like .con", async () => {
    await expect(
      caller.auth.signup({
        email: "user@gmail.con",
        password: "Strong1!",
        firstName: "Test",
        lastName: "User",
        phoneNumber: "+15555555555",
        dateOfBirth: "1990-01-01",
        ssn: "123456789",
        address: "123 Main St",
        city: "Testville",
        state: "CA",
        zipCode: "94105",
      })
    ).rejects.toThrow();
  });

  it("accepts valid email formats", async () => {
    const result = await caller.auth.signup({
      email: "TEST@example.com",
      password: "Strong1!",
      firstName: "Valid",
      lastName: "User",
      phoneNumber: "+15555555555",
      dateOfBirth: "1990-01-01",
      ssn: "123456789",
      address: "123 Main St",
      city: "Testville",
      state: "CA",
      zipCode: "94105",
    });

    expect(result.user.email).toBe("test@example.com");
  });
});