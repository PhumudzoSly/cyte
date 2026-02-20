import fs from "fs-extra";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ensureCyteIgnored } from "../src/core/gitignore.js";

async function withTempDir(run: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cyte-gitignore-"));
  try {
    await run(dir);
  } finally {
    await fs.remove(dir);
  }
}

describe("ensureCyteIgnored", () => {
  it("creates .gitignore with cyte entry when missing", async () => {
    await withTempDir(async (dir) => {
      await ensureCyteIgnored(dir);
      const content = await fs.readFile(path.join(dir, ".gitignore"), "utf8");
      expect(content).toBe("cyte/\n");
    });
  });

  it("appends cyte entry when .gitignore exists without it", async () => {
    await withTempDir(async (dir) => {
      const file = path.join(dir, ".gitignore");
      await fs.writeFile(file, "node_modules/\n", "utf8");
      await ensureCyteIgnored(dir);
      const content = await fs.readFile(file, "utf8");
      expect(content).toContain("node_modules/");
      expect(content).toContain("cyte/");
    });
  });

  it("does not duplicate existing cyte ignore entries", async () => {
    await withTempDir(async (dir) => {
      const file = path.join(dir, ".gitignore");
      await fs.writeFile(file, "cyte/\n", "utf8");
      await ensureCyteIgnored(dir);
      const content = await fs.readFile(file, "utf8");
      expect(content).toBe("cyte/\n");
    });
  });
});

