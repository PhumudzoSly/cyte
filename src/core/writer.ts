import path from "node:path";

import fs from "fs-extra";

import { outputPathForUrl } from "./url.js";

export async function writeMarkdownForUrl(
  outputDir: string,
  url: string,
  markdown: string,
): Promise<string> {
  const relativePath = outputPathForUrl(url);
  const fullPath = path.join(outputDir, relativePath);

  await fs.ensureDir(path.dirname(fullPath));
  await fs.writeFile(fullPath, `${markdown.trim()}\n`, "utf8");

  return fullPath;
}

