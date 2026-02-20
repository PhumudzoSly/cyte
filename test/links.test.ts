import { describe, expect, it } from "vitest";

import { extractLinksFromHtml, filterLinks } from "../src/core/links.js";

describe("link extraction", () => {
  const html = `
    <html>
      <body>
        <a href="/docs/auth">Authentication</a>
        <a href="/docs/aria" aria-label="ARIA Label"></a>
        <a href="/docs/title" title="Title Attr"></a>
        <a href="https://external.com/path"></a>
      </body>
    </html>
  `;

  it("extracts links with title fallback priority", () => {
    const links = extractLinksFromHtml("https://example.com", html);
    expect(links).toHaveLength(4);

    expect(links[0]?.title).toBe("Authentication");
    expect(links[1]?.title).toBe("ARIA Label");
    expect(links[2]?.title).toBe("Title Attr");
    expect(links[3]?.title).toBe("path");
  });

  it("classifies internal and external links", () => {
    const links = extractLinksFromHtml("https://example.com", html);
    const internal = links.filter((link) => link.type === "internal");
    const external = links.filter((link) => link.type === "external");

    expect(internal.length).toBe(3);
    expect(external.length).toBe(1);
  });

  it("filters links by type and match", () => {
    const links = extractLinksFromHtml("https://example.com", html);
    const filtered = filterLinks(links, { internal: true, external: false, match: "auth" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.url).toContain("/docs/auth");
  });
});

