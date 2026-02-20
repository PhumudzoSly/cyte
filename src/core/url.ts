const SKIPPED_PROTOCOLS = ["mailto:", "javascript:", "tel:"];

interface NormalizeOptions {
  stripQuery?: boolean;
}

export function coerceUrl(input: string): string {
  const value = input.trim();
  if (!value) {
    throw new Error("URL cannot be empty");
  }

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value);
  const candidate = hasScheme ? value : `https://${value}`;

  try {
    return new URL(candidate).toString();
  } catch {
    throw new Error(`Invalid URL: ${input}`);
  }
}

export function isSkippableHref(href: string): boolean {
  const value = href.trim().toLowerCase();
  return !value || SKIPPED_PROTOCOLS.some((prefix) => value.startsWith(prefix));
}

export function normalizeUrl(input: string, options: NormalizeOptions = {}): string {
  const { stripQuery = true } = options;
  const parsed = new URL(input);

  parsed.hash = "";
  if (stripQuery) {
    parsed.search = "";
  }

  if (
    (parsed.protocol === "http:" && parsed.port === "80") ||
    (parsed.protocol === "https:" && parsed.port === "443")
  ) {
    parsed.port = "";
  }

  if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
}

export function resolveAndNormalizeUrl(
  baseUrl: string,
  href: string,
  options: NormalizeOptions = {},
): string | null {
  if (isSkippableHref(href)) {
    return null;
  }

  try {
    const resolved = new URL(href, baseUrl).toString();
    return normalizeUrl(resolved, options);
  } catch {
    return null;
  }
}

export function isInternalUrl(baseUrl: string, candidateUrl: string): boolean {
  return new URL(baseUrl).origin === new URL(candidateUrl).origin;
}

export function slugFromUrl(url: string): string {
  const parsed = new URL(url);
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (!segments.length) {
    return parsed.hostname;
  }

  const slug = segments[segments.length - 1].replace(/[-_]+/g, " ").trim();
  return slug || parsed.hostname;
}

function sanitizePathSegment(value: string): string {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-");
}

export function domainFolderForUrl(url: string): string {
  return sanitizePathSegment(new URL(url).hostname);
}

export function outputPathForUrl(url: string): string {
  const parsed = new URL(url);
  const host = domainFolderForUrl(url);
  const pathSegments = parsed.pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => sanitizePathSegment(segment.replace(/\.[^/.]+$/, "")));

  return [host, ...pathSegments, "index.md"].join("/");
}
