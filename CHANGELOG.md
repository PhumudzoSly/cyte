# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project uses Semantic Versioning.

## [Unreleased]

### Added
- `--clean` deep-crawl option to remove existing domain output before crawling.
- `--sitemap` option to seed crawl URLs from sitemap/robots sitemap entries.
- `--no-respect-robots` option for robots.txt filtering control in deep crawl.
- `--format jsonl` support for structured JSON Lines output.
- Deep-crawl failed URL report at `cyte/<domain>/_errors.json`.
- Release documentation section in `README.md`.
- AI agent Node.js wrapper example in `README.md`.

### Changed
- Deep crawl can now be seeded with discovered sitemap URLs.
- JSON output handling supports both pretty JSON and JSONL streams.

