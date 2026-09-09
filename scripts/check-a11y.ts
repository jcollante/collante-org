/**
 * Crawls every page in the built dist/ output and runs axe-core against
 * each one. Fails (exit 1) on any violation with impact "serious" or
 * "critical" — "minor"/"moderate" are printed as warnings but don't fail
 * the build. Used by CI (see .github/workflows/ci.yml) and can be run
 * locally after `npm run build`.
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const DIST_DIR = path.resolve(import.meta.dirname, "../dist");
const PORT = 4322;
const BASE_URL = `http://localhost:${PORT}`;
const FAIL_ON_IMPACT = new Set(["serious", "critical"]);

async function findPages(dir: string, base = ""): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const urls: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      urls.push(...(await findPages(path.join(dir, entry.name), `${base}/${entry.name}`)));
    } else if (entry.name === "index.html") {
      urls.push(`${base}/` || "/");
    } else if (entry.name.endsWith(".html") && entry.name !== "index.html") {
      urls.push(`${base}/${entry.name}`);
    }
  }
  return urls;
}

function waitForServer(url: string, timeoutMs = 20000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status < 500) return resolve();
      } catch {
        // not up yet
      }
      if (Date.now() - start > timeoutMs) return reject(new Error("Preview server did not start in time"));
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

async function main() {
  const urls = (await findPages(DIST_DIR)).sort();
  console.log(`[check-a11y] found ${urls.length} pages to check`);

  const server: ChildProcess = spawn(`npx astro preview --port ${PORT}`, { stdio: "pipe", shell: true });

  let hadFailure = false;

  try {
    await waitForServer(BASE_URL);

    const browser = await chromium.launch();
    for (const url of urls) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}${url}`, { waitUntil: "networkidle" });
      const results = await new AxeBuilder({ page }).analyze();
      await context.close();

      const failing = results.violations.filter((v) => FAIL_ON_IMPACT.has(v.impact ?? ""));
      const warning = results.violations.filter((v) => !FAIL_ON_IMPACT.has(v.impact ?? ""));

      if (failing.length > 0) {
        hadFailure = true;
        console.error(`[check-a11y] FAIL ${url}`);
        for (const v of failing) {
          console.error(`  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`);
        }
      } else {
        console.log(`[check-a11y] ok   ${url}${warning.length ? ` (${warning.length} minor/moderate warning(s))` : ""}`);
      }
      for (const v of warning) {
        console.log(`  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`);
      }
    }
    await browser.close();
  } finally {
    server.kill();
  }

  if (hadFailure) {
    console.error("[check-a11y] accessibility check failed — see serious/critical violations above.");
    process.exit(1);
  }
  console.log("[check-a11y] all pages passed (no serious/critical violations).");
}

main().catch((err) => {
  console.error("[check-a11y] failed:", err);
  process.exit(1);
});
