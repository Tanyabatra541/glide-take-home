import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("UI-101 - dark mode text visibility", () => {
  const cssPath = path.resolve(__dirname, "../app/globals.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  it("defines dark mode colors using CSS variables", () => {
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain(":root {");
    expect(css).toContain("--background: #0a0a0a;");
    expect(css).toContain("--foreground: #ededed;");
  });

  it("applies themed background and text colors to text inputs and textareas", () => {
    // Ensure the selector block for common text-like inputs exists
    expect(css).toContain(
      'input[type="text"],\ninput[type="email"],\ninput[type="password"],\ninput[type="tel"],\ninput[type="date"],\ninput[type="number"],\ninput[type="search"],\ninput[type="url"],\ntextarea {'
    );

    // Ensure the rule sets both background and text color from the theme variables
    expect(css).toContain("background-color: var(--background);");
    expect(css).toContain("color: var(--foreground);");
  });
}
)
