import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function collectTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectTsxFiles(path) : entry.name.endsWith(".tsx") ? [path] : [];
  });
}

describe("navigation contract", () => {
  it("uses Next.js client navigation for internal links", () => {
    const files = [join(root, "app"), join(root, "components")].flatMap(collectTsxFiles);
    const violations = files.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return /<a\b[^>]*\bhref\s*=\s*(?:"\/|\{\s*[`"]\/)/.test(source) ? [relative(root, file)] : [];
    });

    expect(violations).toEqual([]);
  });

  it.each([
    "app/page.tsx",
    "app/results/page.tsx",
    "app/results/[round]/page.tsx",
    "app/draw/page.tsx",
    "app/draw/[preset]/page.tsx",
    "app/stats/page.tsx",
    "app/check/page.tsx",
    "app/archive/page.tsx",
    "app/not-found.tsx",
    "app/error.tsx",
    "app/loading.tsx",
  ])("keeps %s available", (path) => {
    expect(existsSync(join(root, path))).toBe(true);
  });

  it("keeps every primary destination in the shared navigation", () => {
    const chrome = readFileSync(join(root, "components/SiteChrome.tsx"), "utf8");
    for (const href of ["/", "/results", "/draw", "/stats", "/check", "/archive"]) {
      expect(chrome).toContain(`href: "${href}"`);
    }
  });
});
