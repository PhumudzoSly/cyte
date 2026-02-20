import { describe, expect, it } from "vitest";

import { crawlSite } from "../src/core/crawler.js";

describe("crawlSite", () => {
  it("respects depth limit", async () => {
    const graph: Record<string, string[]> = {
      "https://example.com/": ["/a", "/b"],
      "https://example.com/a": ["/c"],
      "https://example.com/b": [],
      "https://example.com/c": [],
    };

    const result = await crawlSite(
      "https://example.com",
      { depth: 1, concurrency: 2, delayMs: 0 },
      async (url) => ({
        discoveredLinks: graph[url] ?? [],
      }),
    );

    const visited = result.pages.map((page) => page.url).sort();
    expect(visited).toEqual([
      "https://example.com/",
      "https://example.com/a",
      "https://example.com/b",
    ]);
    expect(visited).not.toContain("https://example.com/c");
  });

  it("deduplicates already visited links", async () => {
    const result = await crawlSite(
      "https://example.com",
      { depth: 2, concurrency: 3, delayMs: 0 },
      async (url) => {
        if (url === "https://example.com/") {
          return { discoveredLinks: ["/a", "/a", "/a/"] };
        }
        return { discoveredLinks: [] };
      },
    );

    const visited = result.pages.map((page) => page.url);
    expect(visited).toEqual(["https://example.com/", "https://example.com/a"]);
  });
});
