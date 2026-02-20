# cyte Implementation Plan

## Goal

Build a TypeScript CLI that converts web pages to clean Markdown, discovers links, and crawls internal pages recursively with optional JSON output.

## Scope

- In scope (MVP):
  - `cyte <url>` extracts content to Markdown
  - `cyte links <url>` lists links with metadata
  - Recursive crawl via `--deep --depth <n>`
  - Domain-safe crawling and URL normalization
  - Optional `--json` structured output
- Out of scope (post-MVP):
  - robots.txt compliance
  - JavaScript-rendered crawling (Playwright)
  - authenticated/session crawling
  - change detection

## Technical Stack

- Runtime: Node.js LTS + TypeScript
- CLI: `commander`
- HTTP: `undici`
- Parsing: `cheerio`, `jsdom`
- Readability: `@mozilla/readability`
- Markdown conversion: `turndown`, `turndown-plugin-gfm`
- Concurrency: `p-limit`
- FS utilities: `fs-extra`
- UX: `chalk`, `ora`

## Deliverables

1. Working CLI binary: `cyte`
2. Commands:
   - `cyte <url> [options]`
   - `cyte links <url> [options]`
3. Output formats:
   - Markdown files
   - JSON to stdout (or file)
4. Tests for URL normalization, link classification, and crawl depth behavior

## Project Structure

```text
src/
  cli.ts
  commands/
    extract.ts
    links.ts
  core/
    fetcher.ts
    extractor.ts
    markdown.ts
    links.ts
    crawler.ts
    url.ts
    writer.ts
  types.ts
  errors.ts
test/
  url.test.ts
  links.test.ts
  crawler.test.ts
```

## Execution Plan

### Phase 1: Bootstrap CLI + Tooling

Tasks:

- Initialize TypeScript build (`tsconfig`, `src/`, `dist/`)
- Add executable bin mapping in `package.json`
- Configure lint/test scripts
- Install dependencies

Acceptance criteria:

- `npm run build` succeeds
- `npx cyte --help` prints command usage

### Phase 2: Single-Page Extraction

Tasks:

- Implement `fetcher.ts` (timeouts, user-agent, basic retries optional)
- Implement `extractor.ts` using Readability + JSDOM
- Implement Markdown conversion with GFM support
- Implement `writer.ts` to save `.md` output
- Wire `cyte <url>` command

Acceptance criteria:

- Running `cyte https://example.com` creates markdown in output directory
- Headings, lists, code blocks, tables, quotes are preserved when present
- Images and video embeds are represented in markdown

### Phase 3: Link Discovery Command

Tasks:

- Implement link extraction from document anchors
- Title resolution priority:
  1. anchor text
  2. aria-label
  3. title attribute
  4. URL slug fallback
- Internal/external classification by origin
- Add filtering flags: `--internal`, `--external`, `--match`
- Add `--json` output mode

Acceptance criteria:

- `cyte links <url>` returns readable table/text output
- `--json` returns machine-readable array with title/url/type

### Phase 4: Recursive Crawl Engine

Tasks:

- Implement BFS crawl with queue and visited set
- Respect `--depth`, `--concurrency`, `--delay`
- Internal links only when crawling
- Deduplicate normalized URLs
- Persist each page to deterministic file paths

Acceptance criteria:

- `cyte <url> --deep --depth 2` crawls up to two link levels
- No duplicate fetches for equivalent URLs
- Crawl stops at depth limit

### Phase 5: Safety + Robustness

Tasks:

- URL normalization rules:
  - normalize trailing slashes
  - resolve relative URLs
  - drop hash fragments
  - skip `mailto:` and `javascript:`
- Error handling strategy:
  - skip failed pages and continue
  - report summary of failures

Acceptance criteria:

- Invalid/unsupported links are safely skipped
- CLI exits with useful summary and non-zero code only for fatal setup issues

### Phase 6: Output + UX Polish

Tasks:

- Improve progress output (spinners/status)
- Support output directory option (`--output`)
- Improve JSON schema consistency
- Add concise command examples to `README.md`

Acceptance criteria:

- CLI output is clear for both interactive and scripted use
- Output files mirror crawled site structure predictably

## Data Contracts

### Link JSON item

```json
{
  "title": "Authentication",
  "url": "https://docs.site.com/authentication",
  "type": "internal"
}
```

### Extract JSON output

```json
{
  "url": "https://example.com/page",
  "title": "Page Title",
  "markdown": "# Page Title\n...",
  "links": []
}
```

## Definition of Done (MVP)

- Commands behave as specified in this plan
- Core tests pass
- Manual smoke test on at least one docs site and one article site passes
- `README.md` documents install, commands, and examples
- Build artifacts are reproducible from a clean install

## Risks and Mitigations

- Readability may miss content on custom layouts:
  - Mitigation: fallback extraction path using heuristic DOM selection
- Crawl traps and huge sites:
  - Mitigation: strict depth/concurrency defaults, optional URL filters
- Markdown fidelity differences by site:
  - Mitigation: post-processing rules for code blocks/tables/media

## Suggested Default Options

- `depth`: `1`
- `concurrency`: `3`
- `delay`: `150ms`
- `output`: `./output`

## Immediate Next Steps

1. Set up TypeScript CLI scaffold and dependency installation.
2. Implement Phase 2 extraction path end-to-end first.
3. Add `links` command before recursive crawling.
4. Implement crawl engine and then harden normalization/tests.
