#!/usr/bin/env node

import { Command } from "commander";

import { runExtractCommand } from "./commands/extract.js";
import { runLinksCommand } from "./commands/links.js";
import type { ExtractOptions, LinksOptions } from "./types.js";

const program = new Command();

program
  .name("cyte")
  .description("Extract web pages to Markdown and crawl links")
  .version("1.0.0");

program
  .argument("[url]", "URL to extract")
  .option("--deep", "Recursively crawl internal links")
  .option("--depth <number>", "Max crawl depth", "1")
  .option("--delay <number>", "Delay between requests in ms", "150")
  .option("--concurrency <number>", "Max concurrent requests", "3")
  .option("--output <path>", "Output directory", "./cyte")
  .option("--clean", "Delete target domain folder before deep crawl")
  .option("--sitemap", "Seed deep crawl from sitemap.xml/robots sitemap entries")
  .option("--no-respect-robots", "Ignore robots.txt rules in deep crawling")
  .option("--json", "Emit JSON output")
  .option("--format <type>", "Structured output format: json|jsonl", "json")
  .option("--download-media", "Reserved for future media download support", false)
  .action(async (url: string | undefined, cliOptions) => {
    if (!url) {
      program.help();
      return;
    }

    const options: ExtractOptions = {
      deep: Boolean(cliOptions.deep),
      depth: toNonNegativeInt(cliOptions.depth, "depth"),
      delay: toNonNegativeInt(cliOptions.delay, "delay"),
      concurrency: toPositiveInt(cliOptions.concurrency, "concurrency"),
      output: String(cliOptions.output),
      json: Boolean(cliOptions.json),
      format: toOutputFormat(inferFormatArg() ?? cliOptions.format),
      clean: Boolean(cliOptions.clean),
      sitemap: Boolean(cliOptions.sitemap),
      respectRobots: Boolean(cliOptions.respectRobots),
      downloadMedia: Boolean(cliOptions.downloadMedia),
    };

    await runExtractCommand(url, options);
  });

program
  .command("links")
  .description("Discover links for a URL")
  .argument("<url>", "Page URL")
  .option("--internal", "Only internal links")
  .option("--external", "Only external links")
  .option("--match <pattern>", "Filter links by text/URL")
  .option("--json", "Emit JSON output")
  .option("--format <type>", "Structured output format: json|jsonl", "json")
  .action(async (url: string, cliOptions) => {
    const rootOptions = program.opts();
    const inferredFormat = inferFormatArg();
    const options: LinksOptions = {
      internal: Boolean(cliOptions.internal),
      external: Boolean(cliOptions.external),
      match: cliOptions.match ? String(cliOptions.match) : undefined,
      json: Boolean(cliOptions.json || rootOptions.json),
      format: toOutputFormat(inferredFormat ?? cliOptions.format ?? rootOptions.format ?? "json"),
    };

    await runLinksCommand(url, options);
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});

function toPositiveInt(value: string, label: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

function toNonNegativeInt(value: string, label: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return parsed;
}

function toOutputFormat(value: string): "json" | "jsonl" {
  const normalized = String(value).toLowerCase();
  if (normalized !== "json" && normalized !== "jsonl") {
    throw new Error("format must be one of: json, jsonl");
  }
  return normalized;
}

function inferFormatArg(): string | null {
  const args = process.argv;
  if (args.includes("--format") && args.join(" ").includes("--format jsonl")) {
    return "jsonl";
  }
  if (args.includes("--format") && args.join(" ").includes("--format json")) {
    return "json";
  }

  const index = args.lastIndexOf("--format");
  if (index >= 0 && index + 1 < args.length) {
    return args[index + 1] ?? null;
  }

  const inline = args.find((arg) => arg.startsWith("--format="));
  if (inline) {
    return inline.slice("--format=".length);
  }

  return null;
}
