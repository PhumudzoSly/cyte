export type OutputFormat = "json" | "jsonl";

export function printStructured(data: unknown, format: OutputFormat): void {
  if (format === "json") {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      console.log(JSON.stringify(item));
    }
    return;
  }

  if (isCrawlSummary(data)) {
    const { pages, ...summary } = data;
    console.log(JSON.stringify({ type: "summary", ...summary }));
    for (const page of pages) {
      console.log(JSON.stringify({ type: "page", ...page }));
    }
    return;
  }

  console.log(JSON.stringify(data));
}

function isCrawlSummary(
  value: unknown,
): value is { pages: unknown[]; [key: string]: unknown } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "pages" in value &&
      Array.isArray((value as { pages?: unknown }).pages),
  );
}

