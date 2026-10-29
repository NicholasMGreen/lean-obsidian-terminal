import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Obsidian's plugin guidelines forbid global selectors that can affect other
// plugins or themes. Every rule in styles.css must either live under the
// terminal view's leaf or use the unique `lean-` class prefix.
const VIEW_SCOPE = '.workspace-leaf-content[data-type="terminal-view"]';

function selectors(css: string): string[] {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const result: string[] = [];
  for (const match of noComments.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    for (const sel of (match[1] ?? "").split(",")) {
      const trimmed = sel.trim();
      if (trimmed) result.push(trimmed);
    }
  }
  return result;
}

describe("styles.css scoping", () => {
  const css = readFileSync(resolve(__dirname, "..", "styles.css"), "utf8");

  it("has no at-rules, which this check does not parse", () => {
    expect(css.replace(/\/\*[\s\S]*?\*\//g, "")).not.toContain("@");
  });

  it("scopes every selector under the view type or the lean- prefix", () => {
    const unscoped = selectors(css).filter(
      (sel) => !sel.startsWith(VIEW_SCOPE) && !sel.startsWith(".lean-")
    );
    expect(unscoped).toEqual([]);
  });
});
