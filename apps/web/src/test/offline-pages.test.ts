import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("offline.html", () => {
  const html = readFileSync(
    join(__dirname, "../../public/offline.html"),
    "utf-8",
  );

  it("does not use teal color (#0f8f8d)", () => {
    expect(html).not.toMatch(/#0f8f8d/i);
  });

  it("uses indigo color palette", () => {
    const hasIndigo =
      html.includes("#6366f1") ||
      html.includes("var(--indigo") ||
      html.includes("indigo");
    expect(hasIndigo).toBe(true);
  });

  it("has a title indicating offline state", () => {
    expect(html).toContain("Offline");
  });

  it("has a retry link pointing to home", () => {
    expect(html).toMatch(/href=["']\/["']/);
  });
});

describe("service worker", () => {
  const sw = readFileSync(
    join(__dirname, "../../public/sw.js"),
    "utf-8",
  );

  it("does not reference teal colors", () => {
    expect(sw).not.toMatch(/#0f8f8d/i);
  });

  it("has a cache name defined", () => {
    expect(sw).toMatch(/CACHE_NAME\s*=\s*["']/);
  });

  it("uses network-first strategy for non-API routes", () => {
    expect(sw).toContain("fetch(request)");
  });
});
