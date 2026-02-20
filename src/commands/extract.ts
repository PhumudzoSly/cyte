import path from "node:path";

import chalk from "chalk";
import fs from "fs-extra";
import ora from "ora";

import { ensureCyteIgnored } from "../core/gitignore.js";
import { printStructured } from "../core/output.js";
import { dimPath, info, ok, warn } from "../core/ui.js";
import { coerceUrl, domainFolderForUrl, normalizeUrl } from "../core/url.js";
import type { ExtractOptions, ExtractedPage } from "../types.js";

export async function runExtractCommand(rawUrl: string, options: ExtractOptions): Promise<void> {
  const [
    { crawlWebsite },
    { extractContentFromHtml },
    { fetchPage },
    { extractLinksFromHtml },
    { discoverUrlsFromSitemap },
    { loadRobotsMatcher },
  ] =
    await Promise.all([
      import("../core/crawler.js"),
      import("../core/extractor.js"),
      import("../core/fetcher.js"),
      import("../core/links.js"),
      import("../core/sitemap.js"),
      import("../core/robots.js"),
    ]);

  const url = normalizeUrl(coerceUrl(rawUrl), { stripQuery: false });
  const spinner = options.deep && process.stderr.isTTY && !options.json ? ora() : null;

  if (options.deep) {
    await ensureCyteIgnored();
    const domainDir = path.join(options.output, domainFolderForUrl(url));
    if (options.clean) {
      await fs.remove(domainDir);
    }

    let seedUrls: string[] | undefined;
    if (options.sitemap) {
      seedUrls = await discoverUrlsFromSitemap(url);
      if (seedUrls.length === 0) {
        console.error(warn("No URLs discovered from sitemap; falling back to standard crawl."));
      } else {
        console.error(info(`Sitemap discovered ${seedUrls.length} URL(s).`));
      }
    }

    let shouldVisitUrl: ((targetUrl: string) => boolean) | undefined;
    if (options.respectRobots) {
      try {
        const robots = await loadRobotsMatcher(new URL(url).origin);
        shouldVisitUrl = robots.isAllowed;
        console.error(info(`Using robots.txt rules from ${robots.sourceUrl}`));
      } catch {
        console.error(warn("Could not read robots.txt, continuing without robots filtering."));
      }
    }

    spinner?.start(`Crawling ${url} up to depth ${options.depth}...`);
    const summary = await crawlWebsite(url, {
      outputDir: options.output,
      depth: options.depth,
      concurrency: options.concurrency,
      delayMs: options.delay,
      seedUrls,
      shouldVisitUrl,
    });
    spinner?.stop();

    if (options.json) {
      printStructured(summary, options.format);
      return;
    }

    console.error(ok(`Crawl complete for ${summary.startUrl}`));
    console.error(
      `${chalk.bold("Visited")}: ${summary.pagesVisited} | ${chalk.bold("Success")}: ${summary.pagesSucceeded} | ${chalk.bold("Failed")}: ${summary.pagesFailed}`,
    );

    const written = summary.pages.filter((page) => page.success && page.filePath);
    for (const page of written) {
      const relative = path.relative(process.cwd(), page.filePath as string);
      console.error(`${info(page.url)} ${chalk.gray("->")} ${dimPath(relative)}`);
    }
    if (summary.pagesFailed > 0) {
      const errorFilePath = path.join(domainDir, "_errors.json");
      const failedPages = summary.pages.filter((page) => !page.success);
      await fs.ensureDir(domainDir);
      await fs.writeFile(errorFilePath, JSON.stringify(failedPages, null, 2), "utf8");
      console.error(info(`Failed URL report: ${path.relative(process.cwd(), errorFilePath)}`));
      console.error(warn(`${summary.pagesFailed} page(s) failed during crawl.`));
    }
    return;
  }

  const fetched = await fetchPage(url);
  const extracted = extractContentFromHtml(fetched.url, fetched.html);
  const links = extractLinksFromHtml(fetched.url, fetched.html);

  const payload: ExtractedPage = {
    url: fetched.url,
    title: extracted.title,
    markdown: extracted.markdown,
    links,
  };

  if (options.json) {
    printStructured(payload, options.format);
    return;
  }

  console.log(extracted.markdown);
  console.error("");
  console.error(ok(`Extraction complete: ${payload.title}`));
  console.error(info(`Source: ${payload.url}`));
  console.error(info(`Links discovered: ${links.length}`));
}
