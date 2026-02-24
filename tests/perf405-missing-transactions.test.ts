import { beforeEach, describe, it, expect } from "vitest";
import { eq, sql } from "drizzle-orm";

import { appRouter } from "@/server/routers";
import { db } from "@/lib/db";
import { users, accounts, transactions, sessions } from "@/lib/db/schema";

describe("PERF-405 - missing transactions in history", () => {
  beforeEach(async () => {
    // Start each test with a clean slate so prior runs don't affect counts.
    // Disable SQLite foreign key enforcement for this synthetic test data
    // setup to avoid constraint issues from prior runs or partial cleanup.
    await db.run(sql`PRAGMA foreign_keys = OFF`);
    await db.delete(sessions);
    await db.delete(transactions);
    await db.delete(accounts);
    await db.delete(users);
  });

  it("returns all transactions after multiple funding events for the same account", async () => {
    // Create a user directly in the database
    const email = "perf405-user@example.com";

    await db.insert(users).values({
      email,
      password: "hashed-password",
      firstName: "Perf405",
      lastName: "User",
      phoneNumber: "+15555555555",
      dateOfBirth: "1990-01-01",
      ssn: "123456789",
      address: "123 Main St",
      city: "Testville",
      state: "CA",
      zipCode: "94105",
    });

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      throw new Error("Failed to create test user for PERF-405");
    }

    // Create an active account for the user
    const accountNumber = "4050000001";
    await db.insert(accounts).values({
      userId: user.id,
      accountNumber,
      accountType: "checking",
      balance: 0,
      status: "active",
    });

    const account = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber)).get();
    if (!account) {
      throw new Error("Failed to create test account for PERF-405");
    }

    // Create a tRPC caller with an authenticated user context
    const caller = appRouter.createCaller({
      user,
      req: { headers: {} },
      res: {},
    } as any);

    const fundingEvents = 5;
    const fundingAmount = 25;

    // Perform multiple funding events against the same account
    for (let i = 0; i < fundingEvents; i++) {
      await caller.account.fundAccount({
        accountId: account.id,
        amount: fundingAmount,
        fundingSource: {
          type: "card",
          accountNumber: "4242424242424242",
          routingNumber: undefined,
        },
      });
    }

    // When we fetch transactions, we should see one transaction per funding event
    const history = await caller.account.getTransactions({ accountId: account.id });

    expect(history.length).toBe(fundingEvents);
    // Ensure all transactions are for this account and have the expected amount
    for (const tx of history) {
      expect(tx.accountId).toBe(account.id);
      expect(tx.amount).toBe(fundingAmount);
    }
  });
});

