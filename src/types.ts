export type LinkType = "internal" | "external";

export interface LinkItem {
  title: string;
  url: string;
  type: LinkType;
}

export interface ExtractedPage {
  url: string;
  title: string;
  markdown: string;
  links: LinkItem[];
}

export interface FetchResult {
  url: string;
  html: string;
  status: number;
  contentType: string | null;
}

export interface ExtractOptions {
  output: string;
  deep: boolean;
  depth: number;
  delay: number;
  concurrency: number;
  json: boolean;
  format: "json" | "jsonl";
  clean: boolean;
  sitemap: boolean;
  respectRobots: boolean;
  downloadMedia: boolean;
}

export interface LinksOptions {
  internal: boolean;
  external: boolean;
  match?: string;
  json: boolean;
  format: "json" | "jsonl";
}

export interface CrawlPage {
  url: string;
  depth: number;
  title?: string;
  filePath?: string;
  markdown?: string;
  linksDiscovered: number;
  success: boolean;
  error?: string;
}

export interface CrawlSummary {
  startUrl: string;
  pagesVisited: number;
  pagesSucceeded: number;
  pagesFailed: number;
  pages: CrawlPage[];
}
