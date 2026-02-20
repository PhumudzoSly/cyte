import { describe, expect, it } from "vitest";

import { extractContentFromHtml, shouldUseFallbackExtraction } from "../src/core/extractor.js";

describe("extractor fallback heuristic", () => {
  it("uses fallback when readability looks like a TOC", () => {
    const readability = `
* [Problem](#problem)
* [Solution](#solution)
* [Pricing](#pricing)
* [FAQ](#faq)
`;
    const fallback = `
## Problem
Creators lose momentum because social channels demand daily posting and adaptation to each platform.
Most teams end up inconsistent and growth plateaus for months.

## Solution
Maneja plans, drafts, and schedules content across X and Reddit with voice-aware tone control.
It generates context-specific copy so posts look native instead of generic.

## Pricing
Starter and Pro plans include workflow automation, scheduling, and analytics.
Teams can scale with approval flows and multi-account orchestration.
`;

    expect(shouldUseFallbackExtraction(readability, fallback)).toBe(true);
  });

  it("keeps readability when fallback is not clearly better", () => {
    const readability = "## Intro\nThis is useful readable content with context and details.";
    const fallback = "Short content";

    expect(shouldUseFallbackExtraction(readability, fallback)).toBe(false);
  });
});

describe("extractor media URL normalization", () => {
  it("converts relative media URLs to absolute URLs", () => {
    const html = `
      <html>
        <head><title>Media Test</title></head>
        <body>
          <main>
            <h1>Hello</h1>
            <img src="/logo.png" alt="Logo" />
          </main>
        </body>
      </html>
    `;

    const result = extractContentFromHtml("https://maneja.app/docs", html);
    expect(result.markdown).toContain("https://maneja.app/logo.png");
  });
});
