import { beforeEach, describe, it, expect } from "vitest";
import { eq, sql } from "drizzle-orm";

import { appRouter } from "@/server/routers";
import { db } from "@/lib/db";
import { users, accounts, transactions, sessions } from "@/lib/db/schema";

describe("VAL-206 - card number validation", () => {
  beforeEach(async () => {
    // Ensure a clean slate for each test run
    await db.run(sql`PRAGMA foreign_keys = OFF`);
    await db.delete(sessions);
    await db.delete(transactions);
    await db.delete(accounts);
    await db.delete(users);
  });

  const createUserAndAccount = async () => {
    const email = "val206-user@example.com";

    await db.insert(users).values({
      email,
      password: "hashed-password",
      firstName: "Val206",
      lastName: "User",
      phoneNumber: "+15555550123",
      dateOfBirth: "1990-01-01",
      ssn: "123456789",
      address: "123 Main St",
      city: "Testville",
      state: "CA",
      zipCode: "94105",
    });

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      throw new Error("Failed to create test user for VAL-206");
    }

    const accountNumber = "2060000001";
    await db.insert(accounts).values({
      userId: user.id,
      accountNumber,
      accountType: "checking",
      balance: 0,
      status: "active",
    });

    const account = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber)).get();
    if (!account) {
      throw new Error("Failed to create test account for VAL-206");
    }

    return { user, account };
  };

  it("rejects funding with a structurally invalid card number", async () => {
    const { user, account } = await createUserAndAccount();

    const caller = appRouter.createCaller({
      user,
      req: { headers: {} },
      res: {},
    } as any);

    // 16 digits but fails Luhn check
    const invalidCardNumber = "4111111111111112";

    await expect(
      caller.account.fundAccount({
        accountId: account.id,
        amount: 50,
        fundingSource: {
          type: "card",
          accountNumber: invalidCardNumber,
          routingNumber: undefined,
        },
      })
    ).rejects.toBeInstanceOf(Error);

    const accountTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.accountId, account.id));

    expect(accountTransactions.length).toBe(0);
  });

  it("accepts a valid card number", async () => {
    const { user, account } = await createUserAndAccount();

    const caller = appRouter.createCaller({
      user,
      req: { headers: {} },
      res: {},
    } as any);

    const validCardNumber = "4111111111111111";

    await caller.account.fundAccount({
      accountId: account.id,
      amount: 75,
      fundingSource: {
        type: "card",
        accountNumber: validCardNumber,
        routingNumber: undefined,
      },
    });

    const accountTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.accountId, account.id));

    expect(accountTransactions.length).toBe(1);
    expect(accountTransactions[0]!.amount).toBe(75);
  });
});

