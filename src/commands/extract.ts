import path from "node:path";

import chalk from "chalk";
import ora from "ora";

import { ensureCyteIgnored } from "../core/gitignore.js";
import { dimPath, info, ok, warn } from "../core/ui.js";
import { coerceUrl, normalizeUrl } from "../core/url.js";
import type { ExtractOptions, ExtractedPage } from "../types.js";

export async function runExtractCommand(rawUrl: string, options: ExtractOptions): Promise<void> {
  const [{ crawlWebsite }, { extractContentFromHtml }, { fetchPage }, { extractLinksFromHtml }] =
    await Promise.all([
      import("../core/crawler.js"),
      import("../core/extractor.js"),
      import("../core/fetcher.js"),
      import("../core/links.js"),
    ]);

  const url = normalizeUrl(coerceUrl(rawUrl), { stripQuery: false });
  const spinner = options.deep && process.stderr.isTTY && !options.json ? ora() : null;

  if (options.deep) {
    await ensureCyteIgnored();
    spinner?.start(`Crawling ${url} up to depth ${options.depth}...`);
    const summary = await crawlWebsite(url, {
      outputDir: options.output,
      depth: options.depth,
      concurrency: options.concurrency,
      delayMs: options.delay,
    });
    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
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
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(extracted.markdown);
  console.error("");
  console.error(ok(`Extraction complete: ${payload.title}`));
  console.error(info(`Source: ${payload.url}`));
  console.error(info(`Links discovered: ${links.length}`));
}
