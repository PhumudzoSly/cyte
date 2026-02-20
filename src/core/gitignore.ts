import path from "node:path";

import fs from "fs-extra";

export async function ensureCyteIgnored(cwd: string = process.cwd()): Promise<void> {
  const gitignorePath = path.join(cwd, ".gitignore");
  const ignoreEntry = "cyte/";

  const exists = await fs.pathExists(gitignorePath);
  if (!exists) {
    await fs.writeFile(gitignorePath, `${ignoreEntry}\n`, "utf8");
    return;
  }

  const content = await fs.readFile(gitignorePath, "utf8");
  const hasEntry = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => line === "cyte/" || line === "/cyte" || line === "/cyte/" || line === "cyte");

  if (hasEntry) {
    return;
  }

  const prefix = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
  await fs.appendFile(gitignorePath, `${prefix}${ignoreEntry}\n`, "utf8");
}

