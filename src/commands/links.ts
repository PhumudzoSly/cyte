import Table from "cli-table3";
import chalk from "chalk";

import { fetchPage } from "../core/fetcher.js";
import { extractLinksFromHtml, filterLinks } from "../core/links.js";
import { printStructured } from "../core/output.js";
import { info, ok } from "../core/ui.js";
import { coerceUrl, normalizeUrl } from "../core/url.js";
import type { LinksOptions } from "../types.js";

export async function runLinksCommand(rawUrl: string, options: LinksOptions): Promise<void> {
  const url = normalizeUrl(coerceUrl(rawUrl), { stripQuery: false });
  const fetched = await fetchPage(url);
  const links = extractLinksFromHtml(fetched.url, fetched.html);
  const filtered = filterLinks(links, {
    internal: options.internal,
    external: options.external,
    match: options.match,
  });

  if (options.json) {
    printStructured(filtered, options.format);
    return;
  }

  const table = new Table({
    head: ["Type", "Title", "URL"],
    style: {
      head: [],
    },
    colWidths: [10, 32, 100],
    wordWrap: true,
  });

  for (const link of filtered) {
    const typeLabel = link.type === "internal" ? chalk.green("internal") : chalk.yellow("external");
    table.push([typeLabel, link.title, link.url]);
  }

  console.log(table.toString());
  console.error("");
  console.error(ok("Link discovery complete."));
  console.error(info(`Source: ${fetched.url}`));
  console.error(info(`Total links: ${filtered.length}`));
}
