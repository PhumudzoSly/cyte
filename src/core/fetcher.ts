import { fetch } from "undici";

import type { FetchResult } from "../types.js";

interface FetchOptions {
  timeoutMs?: number;
  userAgent?: string;
  allowHttpFallback?: boolean;
}

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_UA = "cyte/1.0 (+https://github.com/)";

export async function fetchPage(url: string, options: FetchOptions = {}): Promise<FetchResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const userAgent = options.userAgent ?? DEFAULT_UA;
  const allowHttpFallback = options.allowHttpFallback ?? true;

  try {
    return await fetchOnce(url, timeoutMs, userAgent);
  } catch (error) {
    const parsed = new URL(url);
    if (!allowHttpFallback || parsed.protocol !== "https:") {
      throw error;
    }

    const fallbackUrl = new URL(url);
    fallbackUrl.protocol = "http:";

    return fetchOnce(fallbackUrl.toString(), timeoutMs, userAgent);
  }
}

async function fetchOnce(url: string, timeoutMs: number, userAgent: string): Promise<FetchResult> {
  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent,
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const contentType = response.headers.get("content-type");
  const html = await response.text();

  return {
    url: response.url,
    html,
    status: response.status,
    contentType,
  };
}
