import { load } from "cheerio";

import type { LinkItem } from "../types.js";
import { isInternalUrl, resolveAndNormalizeUrl, slugFromUrl } from "./url.js";

interface LinkFilterOptions {
  internal?: boolean;
  external?: boolean;
  match?: string;
}

function chooseLinkTitle(anchorText: string, ariaLabel: string, titleAttr: string, url: string): string {
  if (anchorText) return anchorText;
  if (ariaLabel) return ariaLabel;
  if (titleAttr) return titleAttr;
  return slugFromUrl(url);
}

export function extractLinksFromHtml(baseUrl: string, html: string): LinkItem[] {
  const $ = load(html);
  const seen = new Set<string>();
  const links: LinkItem[] = [];

  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href");
    if (!href) {
      return;
    }

    const normalized = resolveAndNormalizeUrl(baseUrl, href, { stripQuery: true });
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);

    const anchorText = $(element).text().trim();
    const ariaLabel = ($(element).attr("aria-label") || "").trim();
    const titleAttr = ($(element).attr("title") || "").trim();
    const title = chooseLinkTitle(anchorText, ariaLabel, titleAttr, normalized);
    const type = isInternalUrl(baseUrl, normalized) ? "internal" : "external";

    links.push({
      title,
      url: normalized,
      type,
    });
  });

  return links;
}

export function filterLinks(links: LinkItem[], options: LinkFilterOptions): LinkItem[] {
  const matcher = options.match ? options.match.toLowerCase() : null;

  return links.filter((link) => {
    if (options.internal && link.type !== "internal") return false;
    if (options.external && link.type !== "external") return false;

    if (matcher) {
      const haystack = `${link.title} ${link.url}`.toLowerCase();
      return haystack.includes(matcher);
    }

    return true;
  });
}

