import { describe, expect, it } from "vitest";

import {
  coerceUrl,
  isInternalUrl,
  normalizeUrl,
  outputPathForUrl,
  resolveAndNormalizeUrl,
} from "../src/core/url.js";

describe("url normalization", () => {
  it("removes fragments and trailing slashes", () => {
    expect(normalizeUrl("https://example.com/docs/#intro")).toBe("https://example.com/docs");
    expect(normalizeUrl("https://example.com/docs/")).toBe("https://example.com/docs");
  });

  it("coerces bare domains to https", () => {
    expect(coerceUrl("vercel.com")).toBe("https://vercel.com/");
    expect(coerceUrl("example.com/docs")).toBe("https://example.com/docs");
  });

  it("drops query strings by default", () => {
    expect(normalizeUrl("https://example.com/docs?page=1")).toBe("https://example.com/docs");
  });

  it("keeps query string when stripQuery is false", () => {
    expect(normalizeUrl("https://example.com/docs?page=1", { stripQuery: false })).toBe(
      "https://example.com/docs?page=1",
    );
  });

  it("skips mailto/javascript links", () => {
    expect(resolveAndNormalizeUrl("https://example.com", "mailto:test@example.com")).toBeNull();
    expect(resolveAndNormalizeUrl("https://example.com", "javascript:void(0)")).toBeNull();
  });

  it("classifies internal links", () => {
    expect(isInternalUrl("https://example.com/a", "https://example.com/b")).toBe(true);
    expect(isInternalUrl("https://example.com/a", "https://other.com/b")).toBe(false);
  });

  it("maps URL to output markdown path", () => {
    expect(outputPathForUrl("https://example.com")).toBe("example.com/index.md");
    expect(outputPathForUrl("https://example.com/docs/intro")).toBe(
      "example.com/docs/intro/index.md",
    );
    expect(outputPathForUrl("https://example.com/about/")).toBe("example.com/about/index.md");
  });
});
