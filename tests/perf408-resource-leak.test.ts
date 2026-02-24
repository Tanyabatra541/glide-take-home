import { describe, it, expect, vi } from "vitest";

describe("PERF-408 - database resource leak", () => {
  it("uses a single SQLite connection even when initDb is called", async () => {
    // Ensure we get a fresh module instance for this test
    vi.resetModules();

    const execSpy = vi.fn();
    const constructorSpy = vi.fn();

    // Use a real class so it can be constructed with `new`
    class DatabaseMock {
      exec = execSpy;

      constructor() {
        constructorSpy();
      }
    }

    // Mock better-sqlite3 so we can count how many times a connection is created
    vi.doMock("better-sqlite3", () => ({
      default: DatabaseMock,
    }));

    // Import after setting up the mock so the constructor spy is used
    const dbModule = await import("@/lib/db");

    // On first import, we should create exactly one connection
    expect(constructorSpy).toHaveBeenCalledTimes(1);

    // Calling initDb again should not create any new Database instances
    dbModule.initDb();
    expect(constructorSpy).toHaveBeenCalledTimes(1);

    // Re-importing the module should come from the module cache without new connections
    const dbModuleAgain = await import("@/lib/db");
    dbModuleAgain.initDb();
    expect(constructorSpy).toHaveBeenCalledTimes(1);
  });
});


