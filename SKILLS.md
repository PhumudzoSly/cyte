---
name: cyte-cli
description: CLI usage guide for AI agents using cyte to extract website markdown, discover links, and run deep internal crawls with JSON/JSONL outputs. Use when users ask to scrape docs/sites, collect page content, or build crawl data via npx, pnpm dlx, or global install.
license: MIT
metadata:
  author: cyte
  version: "1.0.0"
---

# cyte CLI Skill

Practical command guide for AI agents using the `cyte` CLI.

## When to Apply

Reference this skill when:

- A user asks to extract content from a URL
- A user asks to discover links from a page
- A user asks to crawl docs/sites recursively
- A user asks for structured JSON/JSONL output for automation

## Execution Modes

- One-off (recommended): `npx cyte ...`
- PNPM one-off: `pnpm dlx cyte ...`
- Global install: `cyte ...`

## Command Reference

### 1. Extract Single Page

- Markdown to stdout:
  - `npx cyte <url>`
- JSON object:
  - `npx cyte <url> --json`

### 2. Discover Links

- All links:
  - `npx cyte links <url> --json`
- Internal only:
  - `npx cyte links <url> --internal --json`
- External only:
  - `npx cyte links <url> --external --json`
- Internal filtered by topic:
  - `npx cyte links <url> --internal --match <pattern> --json`

### 3. Deep Crawl

- Crawl and write markdown files:
  - `npx cyte <url> --deep --depth 2`
- Crawl with JSON summary:
  - `npx cyte <url> --deep --json`
- Crawl with JSONL stream:
  - `npx cyte <url> --deep --json --format jsonl`

## Required Agent Workflow

1. If URL is missing, ask for it.
2. If task scope is unclear, start with `links --json`.
3. Prefer `--json` for machine workflows.
4. Extract selected pages before escalating to full crawl.
5. Use conservative crawl defaults first:
   - `--depth 1 --concurrency 2 --delay 200`
6. Respect robots by default.
7. Use `--no-respect-robots` only when explicitly requested.
8. Tell user that deep crawl writes to `./cyte` unless `--output` is set.

## Output Contracts

- `cyte <url> --json`
  - `{ url, title, markdown, links }`
- `cyte links <url> --json`
  - `[{ title, url, type }]`
- `cyte <url> --deep --json`
  - `{ startUrl, pagesVisited, pagesSucceeded, pagesFailed, pages }`

## Quick Examples

```bash
npx cyte links docs.example.com --internal --json
npx cyte docs.example.com/getting-started --json
npx cyte docs.example.com --deep --depth 2 --json
```
