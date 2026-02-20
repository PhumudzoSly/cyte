# cyte

`cyte` is a TypeScript CLI for extracting website content into Markdown, discovering links, and crawling internal pages recursively.

## What It Does

- Extract a page into clean Markdown.
- Discover all links on a page with `internal`/`external` classification.
- Recursively crawl internal pages and save content by domain + route.
- Output JSON for automation/agent workflows.

## Install

```bash
pnpm install
pnpm build
```

## Quickstart

Single page extraction (stdout):

```bash
cyte vercel.com
```

Links only:

```bash
cyte links vercel.com --json
```

Deep crawl + file output:

```bash
cyte vercel.com --deep --depth 2
```

## Command Reference

### `cyte <url>`

Extract a single page into Markdown.

Default behavior:

- Prints Markdown to `stdout`.
- Does not save files unless `--deep` is enabled.

Examples:

```bash
cyte https://example.com
cyte example.com
cyte example.com --json
```

Options:

- `--deep`: enable recursive internal crawl and file output.
- `--depth <number>`: max crawl depth, default `1`.
- `--delay <number>`: delay between requests in ms, default `150`.
- `--concurrency <number>`: max parallel crawl requests, default `3`.
- `--output <path>`: output directory for deep crawl, default `./cyte`.
- `--json`: return structured JSON instead of human output.
- `--download-media`: reserved flag (not active yet).

### `cyte links <url>`

Return links found in a page.

Examples:

```bash
cyte links https://example.com
cyte links example.com --json
cyte links example.com --internal
cyte links example.com --external --match docs
```

Options:

- `--internal`: only internal links.
- `--external`: only external links.
- `--match <pattern>`: filter by title or URL substring.
- `--json`: output JSON array.

## URL Handling

- Bare domains are accepted: `vercel.com` -> `https://vercel.com/`.
- For failed `https://` requests, cyte retries with `http://`.
- URLs are normalized for crawl deduplication:
  - hash fragments removed
  - query string removed in crawl/link normalization
  - trailing slashes normalized
- Skips unsupported link protocols:
  - `mailto:`
  - `javascript:`
  - `tel:`

## Output Behavior

### Single page mode (`cyte <url>`)

- Returns extracted markdown to stdout.
- Also prints success metadata (source URL, links discovered).
- Does not write files.

### Links mode (`cyte links <url>`)

- Returns links table or JSON.
- Does not write files.

### Deep mode (`cyte <url> --deep`)

- Crawls internal links only.
- Writes markdown files grouped by domain and route:

```text
cyte/
  example.com/
    index.md
    docs/
      index.md
      intro/
        index.md
```

- Existing output files at the same path are overwritten.
- Missing directories are created automatically.
- Deep crawl ensures `.gitignore` contains `cyte/`.

## JSON Output Contracts

### Extract JSON (`cyte <url> --json`)

```json
{
  "url": "https://example.com/",
  "title": "Example Domain",
  "markdown": "# Example Domain\n...",
  "links": [
    {
      "title": "Learn more",
      "url": "https://iana.org/domains/example",
      "type": "external"
    }
  ]
}
```

### Links JSON (`cyte links <url> --json`)

```json
[
  {
    "title": "Docs",
    "url": "https://example.com/docs",
    "type": "internal"
  }
]
```

### Crawl JSON (`cyte <url> --deep --json`)

```json
{
  "startUrl": "https://example.com/",
  "pagesVisited": 10,
  "pagesSucceeded": 10,
  "pagesFailed": 0,
  "pages": []
}
```

## AI Agent Usage

`cyte` is agent-friendly by default: deterministic CLI, URL normalization, and machine-readable `--json` output.

### Core agent workflows

1. Discover routes, then fetch selected pages:

```bash
cyte links https://docs.example.com --json
cyte https://docs.example.com/authentication --json
```

2. Filter internal links by topic:

```bash
cyte links https://docs.example.com --internal --match auth --json
```

3. Build a knowledge snapshot for RAG:

```bash
cyte https://docs.example.com --deep --depth 2 --json
```

### Recommended decision loop for agents

1. Run `links --json` on the seed page.
2. Keep only `internal` links and apply topic filters (`--match`).
3. Fetch top candidate pages with `cyte <url> --json`.
4. Escalate to deep crawl if coverage is insufficient.
5. Index markdown + metadata for retrieval.

### Contracts agents can rely on

- `cyte links <url> --json` returns an array of:
  - `{ title, url, type }`
- `cyte <url> --json` returns:
  - `{ url, title, markdown, links }`
- `cyte <url> --deep --json` returns summary:
  - `{ startUrl, pagesVisited, pagesSucceeded, pagesFailed, pages }`

### Production notes for agent pipelines

- Use `--json` in automation paths.
- Start conservative on crawling:
  - `--depth 1 --concurrency 2 --delay 200`
- Treat page-level failures as partial success and continue.
- Re-crawls overwrite existing files by output path.

## Extraction Details

- Uses Readability + fallback extraction for landing pages where Readability is too thin.
- Preserves headings, lists, tables, code blocks, blockquotes.
- Converts relative media URLs to absolute URLs:
  - `/logo.png` -> `https://domain.com/logo.png`

## Development

Run in dev mode:

```bash
pnpm dev -- --help
```

Build:

```bash
pnpm build
```

Tests:

```bash
pnpm test
pnpm test:watch
```

## Tech Stack

- Node.js + TypeScript
- Commander
- Undici
- JSDOM + Readability
- Turndown + GFM plugin
- Cheerio
- p-limit
- fs-extra

## Troubleshooting

- If output seems too thin on a landing page, rerun and compare `--json` output to inspect extracted content and links.
- If a site blocks requests, try a lower concurrency and add delay:
  - `--concurrency 1 --delay 400`
- If deep crawl seems incomplete, increase `--depth`.

## License

MIT. See `LICENSE`.
