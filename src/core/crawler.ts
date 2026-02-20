import pLimit from "p-limit";

import type { CrawlPage, CrawlSummary } from "../types.js";
import { isInternalUrl, normalizeUrl, resolveAndNormalizeUrl } from "./url.js";

interface CrawlEngineOptions {
  depth: number;
  concurrency: number;
  delayMs: number;
  seedUrls?: string[];
  shouldVisitUrl?: (url: string) => boolean;
}

interface VisitResult<T> {
  data?: T;
  discoveredLinks?: string[];
}

type VisitFn<T> = (url: string, depth: number) => Promise<VisitResult<T>>;

function wait(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function crawlSite<T>(
  startUrl: string,
  options: CrawlEngineOptions,
  visit: VisitFn<T>,
): Promise<{ pages: Array<CrawlPage & { data?: T }>; visitedUrls: Set<string> }> {
  const normalizedStart = normalizeUrl(startUrl, { stripQuery: true });
  const baseOrigin = new URL(normalizedStart).origin;
  const initialQueue =
    options.seedUrls && options.seedUrls.length > 0
      ? options.seedUrls.map((url) => normalizeUrl(url, { stripQuery: true }))
      : [normalizedStart];
  const uniqueInitialQueue = [...new Set(initialQueue)];
  const visited = new Set<string>(uniqueInitialQueue);
  const pages: Array<CrawlPage & { data?: T }> = [];

  let currentLevel = uniqueInitialQueue.filter((url) => {
    if (new URL(url).origin !== baseOrigin) return false;
    if (!options.shouldVisitUrl) return true;
    return options.shouldVisitUrl(url);
  });

  for (let depth = 0; depth <= options.depth && currentLevel.length > 0; depth += 1) {
    const nextLevelCandidates: string[] = [];
    const limit = pLimit(Math.max(1, options.concurrency));

    await Promise.all(
      currentLevel.map((url) =>
        limit(async () => {
          await wait(options.delayMs);

          try {
            const result = await visit(url, depth);
            const links = result.discoveredLinks ?? [];
            pages.push({
              url,
              depth,
              linksDiscovered: links.length,
              success: true,
              data: result.data,
            });

            for (const href of links) {
              const normalized = resolveAndNormalizeUrl(url, href, { stripQuery: true });
              if (!normalized) continue;
              if (!isInternalUrl(normalizedStart, normalized)) continue;
              if (new URL(normalized).origin !== baseOrigin) continue;
              if (options.shouldVisitUrl && !options.shouldVisitUrl(normalized)) continue;
              if (visited.has(normalized)) continue;
              visited.add(normalized);
              nextLevelCandidates.push(normalized);
            }
          } catch (error) {
            pages.push({
              url,
              depth,
              linksDiscovered: 0,
              success: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }),
      ),
    );

    currentLevel = nextLevelCandidates;
  }

  return { pages, visitedUrls: visited };
}

interface CrawlWebsiteOptions {
  outputDir: string;
  depth: number;
  concurrency: number;
  delayMs: number;
  seedUrls?: string[];
  shouldVisitUrl?: (url: string) => boolean;
}

export async function crawlWebsite(startUrl: string, options: CrawlWebsiteOptions): Promise<CrawlSummary> {
  const [{ extractContentFromHtml }, { fetchPage }, { extractLinksFromHtml }, { writeMarkdownForUrl }] =
    await Promise.all([
      import("./extractor.js"),
      import("./fetcher.js"),
      import("./links.js"),
      import("./writer.js"),
    ]);

  const normalizedStart = normalizeUrl(startUrl, { stripQuery: true });

  const crawlResult = await crawlSite(normalizedStart, options, async (url) => {
    const fetched = await fetchPage(url);
    const extracted = extractContentFromHtml(fetched.url, fetched.html);
    const links = extractLinksFromHtml(fetched.url, fetched.html);
    const filePath = await writeMarkdownForUrl(options.outputDir, fetched.url, extracted.markdown);

    return {
      data: {
        title: extracted.title,
        filePath,
        markdown: extracted.markdown,
      },
      discoveredLinks: links.map((link) => link.url),
    };
  });

  const pages = crawlResult.pages.map((page) => {
    if (!page.success || !page.data) return page;

    return {
      ...page,
      title: page.data.title,
      filePath: page.data.filePath,
      markdown: page.data.markdown,
    };
  });

  const pagesSucceeded = pages.filter((page) => page.success).length;
  const pagesFailed = pages.length - pagesSucceeded;

  return {
    startUrl: normalizedStart,
    pagesVisited: pages.length,
    pagesSucceeded,
    pagesFailed,
    pages,
  };
}
