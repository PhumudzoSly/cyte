import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

import { htmlToMarkdown } from "./markdown.js";

interface ExtractionResult {
  title: string;
  markdown: string;
}

export function extractContentFromHtml(pageUrl: string, html: string): ExtractionResult {
  const readabilityDom = new JSDOM(html, { url: pageUrl });
  const fallbackDom = new JSDOM(html, { url: pageUrl });

  const readabilityDoc = readabilityDom.window.document;
  const fallbackDoc = fallbackDom.window.document;

  const parsed = new Readability(readabilityDoc).parse();

  const title = parsed?.title?.trim() || fallbackDoc.title || pageUrl;
  const readabilityHtml = absolutizeMediaUrls(parsed?.content || "", pageUrl);
  const fallbackHtml = absolutizeMediaUrls(extractFallbackHtml(fallbackDoc), pageUrl);
  const readabilityMarkdown = htmlToMarkdown(readabilityHtml);
  const fallbackMarkdown = htmlToMarkdown(fallbackHtml);

  const markdown = shouldUseFallbackExtraction(readabilityMarkdown, fallbackMarkdown)
    ? fallbackMarkdown
    : readabilityMarkdown;

  if (!markdown.trim()) {
    return {
      title,
      markdown: `# ${title}\n\n_No readable content found._`,
    };
  }

  return {
    title,
    markdown: `# ${title}\n\n${markdown}`.trim(),
  };
}

function absolutizeMediaUrls(contentHtml: string, pageUrl: string): string {
  if (!contentHtml.trim()) {
    return contentHtml;
  }

  const dom = new JSDOM(`<body>${contentHtml}</body>`, { url: pageUrl });
  const doc = dom.window.document;
  const selectors = [
    "img[src]",
    "video[src]",
    "video[poster]",
    "source[src]",
    "audio[src]",
    "iframe[src]",
  ];

  for (const selector of selectors) {
    doc.querySelectorAll(selector).forEach((el) => {
      if (el.hasAttribute("src")) {
        const src = el.getAttribute("src");
        if (src) {
          try {
            el.setAttribute("src", new URL(src, pageUrl).toString());
          } catch {
            // Ignore malformed URLs and keep original attribute.
          }
        }
      }

      if (el.hasAttribute("poster")) {
        const poster = el.getAttribute("poster");
        if (poster) {
          try {
            el.setAttribute("poster", new URL(poster, pageUrl).toString());
          } catch {
            // Ignore malformed URLs and keep original attribute.
          }
        }
      }
    });
  }

  return doc.body.innerHTML;
}

function extractFallbackHtml(doc: Document): string {
  const candidate =
    doc.querySelector("main") ??
    doc.querySelector("article") ??
    doc.querySelector('[role="main"]') ??
    doc.body;

  if (!candidate) {
    return "";
  }

  const clone = candidate.cloneNode(true) as Element;
  const NOISE_SELECTORS = [
    "script",
    "style",
    "noscript",
    "template",
    "nav",
    "footer",
    "aside",
    "form",
    "iframe[src*='ads']",
    "[aria-hidden='true']",
  ];

  for (const selector of NOISE_SELECTORS) {
    clone.querySelectorAll(selector).forEach((node) => node.remove());
  }

  return clone.innerHTML;
}

export function shouldUseFallbackExtraction(readabilityMd: string, fallbackMd: string): boolean {
  const rLen = contentSignalLength(readabilityMd);
  const fLen = contentSignalLength(fallbackMd);

  if (fLen < 400) {
    return false;
  }

  if (rLen === 0 && fLen > 0) {
    return true;
  }

  const sectionJump = fLen >= 900 && fLen > rLen * 1.8;
  const tinyReadability = rLen < 450 && fLen > 1000;
  const tocLikeReadability = isLikelyTableOfContents(readabilityMd) && fLen > rLen * 1.5;

  return sectionJump || tinyReadability || tocLikeReadability;
}

function isLikelyTableOfContents(markdown: string): boolean {
  const anchorLinkMatches = markdown.match(/\]\(#/g) ?? [];
  const headingMatches = markdown.match(/^#{1,6}\s+/gm) ?? [];
  return anchorLinkMatches.length >= 4 && headingMatches.length <= 1;
}

function contentSignalLength(markdown: string): number {
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[#>*_\-\n\r]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return stripped.length;
}
