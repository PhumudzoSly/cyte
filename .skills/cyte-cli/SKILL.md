---
name: cyte-cli
description: Use cyte to extract webpage markdown, discover links, and crawl internal docs/pages. Use this skill when users ask an agent to collect website content, run doc discovery, or build machine-readable crawl outputs with npx/pnpm dlx/global cyte.
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

## Core Commands

### 1. Extract Single Page

```bash
npx cyte <url>
npx cyte <url> --json
```

### 2. Discover Links

```bash
npx cyte links <url>
npx cyte links <url> --json
npx cyte links <url> --internal --json
npx cyte links <url> --external --json
npx cyte links <url> --internal --match <pattern> --json
```

### 3. Deep Crawl

```bash
npx cyte <url> --deep --depth 2
npx cyte <url> --deep --json
npx cyte <url> --deep --json --format jsonl
```

## Agent Workflow

1. Ensure URL is present (ask user if missing).
2. Default to `links --json` for exploration.
3. Extract priority pages via `<url> --json`.
4. Escalate to `--deep` only when broader coverage is required.
5. Use conservative crawl defaults first:
   - `--depth 1 --concurrency 2 --delay 200`

## Output Contracts

- `cyte <url> --json`
  - `{ url, title, markdown, links }`
- `cyte links <url> --json`
  - `[{ title, url, type }]`
- `cyte <url> --deep --json`
  - `{ startUrl, pagesVisited, pagesSucceeded, pagesFailed, pages }`

## Behavior and Constraints

- Prefer `--json` for machine workflows.
- Bare domains are valid input (for example: `vercel.com`).
- Respect robots by default.
- Use `--no-respect-robots` only if explicitly requested.
- Deep crawl writes files to `./cyte` unless `--output` is set.
- Use `--sitemap` if regular traversal misses important pages.

## Quick Examples

```bash
# Discover docs URLs first
npx cyte links docs.example.com --internal --json

# Pull one page into JSON for an agent
npx cyte docs.example.com/getting-started --json

# Build a larger snapshot
npx cyte docs.example.com --deep --depth 2 --json
```
