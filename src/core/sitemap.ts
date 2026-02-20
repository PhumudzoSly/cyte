import { fetch } from "undici";

import { normalizeUrl } from "./url.js";

const MAX_SITEMAPS = 20;

export async function discoverUrlsFromSitemap(seedUrl: string): Promise<string[]> {
  const base = new URL(seedUrl);
  const origin = base.origin;
  const initialSitemaps = await discoverSitemapEndpoints(origin);

  const visitedSitemaps = new Set<string>();
  const queue = [...initialSitemaps];
  const discoveredUrls = new Set<string>();

  while (queue.length > 0 && visitedSitemaps.size < MAX_SITEMAPS) {
    const sitemapUrl = queue.shift();
    if (!sitemapUrl || visitedSitemaps.has(sitemapUrl)) continue;
    visitedSitemaps.add(sitemapUrl);

    const xml = await fetchText(sitemapUrl);
    if (!xml) continue;

    const locs = extractLocEntries(xml);
    if (!locs.length) continue;

    const isIndex = /<sitemapindex/i.test(xml);
    for (const loc of locs) {
      if (isIndex || looksLikeSitemap(loc)) {
        if (!visitedSitemaps.has(loc)) {
          queue.push(loc);
        }
        continue;
      }

      try {
        const normalized = normalizeUrl(loc, { stripQuery: true });
        if (new URL(normalized).origin === origin) {
          discoveredUrls.add(normalized);
        }
      } catch {
        // Ignore invalid sitemap entries.
      }
    }
  }

  return [...discoveredUrls];
}

async function discoverSitemapEndpoints(origin: string): Promise<string[]> {
  const discovered = new Set<string>([new URL("/sitemap.xml", origin).toString()]);
  const robotsUrl = new URL("/robots.txt", origin).toString();
  const robotsText = await fetchText(robotsUrl);

  if (!robotsText) {
    return [...discovered];
  }

  for (const line of robotsText.split(/\r?\n/)) {
    const match = line.match(/^\s*sitemap:\s*(\S+)\s*$/i);
    const loc = match?.[1];
    if (!loc) continue;

    try {
      discovered.add(new URL(loc, origin).toString());
    } catch {
      // Ignore invalid sitemap URLs.
    }
  }

  return [...discovered];
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "cyte/1.0",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

function extractLocEntries(xml: string): string[] {
  const values: string[] = [];
  const regex = /<loc>([\s\S]*?)<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    const value = decodeXmlEntities(match[1]?.trim() || "");
    if (value) values.push(value);
  }
  return values;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function looksLikeSitemap(url: string): boolean {
  return /\.xml($|\?)/i.test(url) || /sitemap/i.test(url);
}

