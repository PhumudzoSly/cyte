import { fetch } from "undici";

interface Rule {
  path: string;
  allow: boolean;
}

export interface RobotsMatcher {
  isAllowed: (url: string) => boolean;
  sourceUrl: string;
}

export async function loadRobotsMatcher(
  origin: string,
  userAgent: string = "cyte",
): Promise<RobotsMatcher> {
  const robotsUrl = new URL("/robots.txt", origin).toString();
  const response = await fetch(robotsUrl, {
    headers: {
      "user-agent": `${userAgent}/1.0`,
      accept: "text/plain",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    return {
      sourceUrl: robotsUrl,
      isAllowed: () => true,
    };
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    return {
      sourceUrl: robotsUrl,
      isAllowed: () => true,
    };
  }

  const text = await response.text();
  const rules = parseRobotsRules(text, userAgent);

  return {
    sourceUrl: robotsUrl,
    isAllowed: (url: string) => isPathAllowed(new URL(url).pathname, rules),
  };
}

function parseRobotsRules(text: string, userAgent: string): Rule[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const ua = userAgent.toLowerCase();
  const wildcardRules: Rule[] = [];
  const specificRules: Rule[] = [];

  let activeGroup: "none" | "wildcard" | "specific" = "none";

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (!key) continue;

    if (key === "user-agent") {
      const candidate = value.toLowerCase();
      if (candidate === "*") {
        activeGroup = "wildcard";
      } else if (candidate === ua || candidate.includes(ua)) {
        activeGroup = "specific";
      } else {
        activeGroup = "none";
      }
      continue;
    }

    if (key !== "allow" && key !== "disallow") continue;
    if (!value) continue;
    if (activeGroup === "none") continue;

    const rule: Rule = {
      path: value,
      allow: key === "allow",
    };

    if (activeGroup === "specific") {
      specificRules.push(rule);
    } else {
      wildcardRules.push(rule);
    }
  }

  return specificRules.length > 0 ? specificRules : wildcardRules;
}

function isPathAllowed(pathname: string, rules: Rule[]): boolean {
  if (!rules.length) return true;
  let winner: Rule | null = null;

  for (const rule of rules) {
    if (pathMatchesRule(pathname, rule.path)) {
      if (!winner || rule.path.length > winner.path.length) {
        winner = rule;
      }
    }
  }

  if (!winner) return true;
  return winner.allow;
}

function pathMatchesRule(pathname: string, pattern: string): boolean {
  if (pattern === "/") return true;
  const normalizedPattern = pattern.replace(/\*+$/, "");
  return pathname.startsWith(normalizedPattern);
}

