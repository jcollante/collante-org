/**
 * Scans every HTML page in the built dist/ output and fails (exit 1) on
 * anything corporate web gateways (Zscaler etc.) inspect more aggressively:
 * third-party scripts/styles/images/frames, forms, links through URL
 * shorteners, and links to executable/archive downloads. Keeps the site's
 * zero-third-party posture enforced rather than just documented — see
 * plan.MD Phase 12.4. Used by CI; run locally after `npm run build`.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const DIST_DIR = path.resolve(import.meta.dirname, "../dist");

const SHORTENERS = [
  "bit.ly", "t.co", "tinyurl.com", "goo.gl", "ow.ly", "buff.ly",
  "is.gd", "lnkd.in", "rebrand.ly", "cutt.ly", "shorturl.at", "tiny.cc",
];
const DOWNLOAD_EXT = /\.(exe|msi|dmg|pkg|zip|rar|7z|tar|gz|iso|bat|cmd|ps1|scr|jar|apk)(\?|#|$)/i;

async function findHtml(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await findHtml(full)));
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

const isExternal = (url: string) => /^(https?:)?\/\//i.test(url);

function hostOf(url: string): string {
  try {
    return new URL(url, "https://www.collante.org").hostname.toLowerCase();
  } catch {
    return "";
  }
}

function checkPage(html: string): string[] {
  const problems: string[] = [];

  // Anything the browser loads automatically must be same-origin.
  const loaded = /<(script|img|iframe|frame|embed|object|source|video|audio)\b[^>]*?\s(?:src|data)\s*=\s*["']([^"']+)["']/gi;
  for (const [, tag, url] of html.matchAll(loaded)) {
    if (isExternal(url)) problems.push(`external <${tag}> source: ${url}`);
  }
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = /\srel\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ?? "";
    const href = /\shref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ?? "";
    if (/stylesheet|preload|modulepreload|icon|manifest/i.test(rel) && isExternal(href)) {
      problems.push(`external <link rel="${rel}">: ${href}`);
    }
  }
  if (/<(iframe|frame)\b/i.test(html)) problems.push("contains an <iframe>/<frame>");
  if (/<form\b/i.test(html)) problems.push("contains a <form>");

  for (const [, href] of html.matchAll(/<a\b[^>]*?\shref\s*=\s*["']([^"']+)["']/gi)) {
    const host = hostOf(href);
    if (SHORTENERS.some((s) => host === s || host.endsWith(`.${s}`))) {
      problems.push(`link through URL shortener: ${href}`);
    }
    if (DOWNLOAD_EXT.test(href)) problems.push(`link to executable/archive download: ${href}`);
  }

  return problems;
}

async function main() {
  const files = (await findHtml(DIST_DIR)).sort();
  console.log(`[check-third-party] scanning ${files.length} pages`);

  let failed = false;
  for (const file of files) {
    const problems = checkPage(await readFile(file, "utf8"));
    if (problems.length === 0) continue;
    failed = true;
    console.error(`\n✗ ${path.relative(DIST_DIR, file)}`);
    for (const problem of problems) console.error(`  - ${problem}`);
  }

  if (failed) {
    console.error("\n[check-third-party] FAILED — see plan.MD Phase 12.4 for why these matter.");
    process.exit(1);
  }
  console.log("[check-third-party] OK — no third-party loads, forms, shorteners, or risky downloads.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
