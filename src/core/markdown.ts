import { createRequire } from "node:module";

import TurndownService from "turndown";

const require = createRequire(import.meta.url);
const gfmPlugin = require("turndown-plugin-gfm") as { gfm: (service: TurndownService) => void };

function createTurndown(): TurndownService {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });

  gfmPlugin.gfm(service);

  service.addRule("iframeToLink", {
    filter: "iframe",
    replacement: (_content, node) => {
      const src = (node as HTMLElement).getAttribute("src");
      return src ? `\n[Embedded Video](${src})\n` : "";
    },
  });

  service.addRule("videoToLink", {
    filter: "video",
    replacement: (_content, node) => {
      const video = node as HTMLElement;
      const src = video.getAttribute("src") || video.querySelector("source")?.getAttribute("src");
      return src ? `\n[Video](${src})\n` : "";
    },
  });

  return service;
}

const turndown = createTurndown();

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html).trim();
}
