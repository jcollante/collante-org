/**
 * Build-time Mermaid → static SVG rendering (diagram tier 2).
 *
 * Reads every .mmd source file in src/diagrams/, renders it to SVG using
 * the real `mermaid` package running inside a headless Playwright page
 * (mermaid's renderer needs a DOM), and writes the result to
 * public/diagrams/<name>.svg. No Mermaid JS ever ships to the browser —
 * this script runs at build time only, invoked from `npm run build`.
 *
 * Rendered SVGs are committed. Each one ends with a hash of its source,
 * the theme, and the mermaid version; a diagram whose hash still matches is
 * skipped, so builds without a Playwright browser (Cloudflare Pages) only
 * need one when a diagram actually changed — and then fail with a clear
 * "render locally and commit" message instead of a Playwright stack trace.
 *
 * Theme colors are hand-transcribed from src/styles/tokens.css. Mermaid's
 * themeVariables need literal color strings, not CSS custom properties, so
 * keep these in sync if tokens.css changes.
 */
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { chromium, type Page } from "playwright";

const SRC_DIR = path.resolve(import.meta.dirname, "../src/diagrams");
const OUT_DIR = path.resolve(import.meta.dirname, "../public/diagrams");
const MERMAID_BUNDLE = path.resolve(import.meta.dirname, "../node_modules/mermaid/dist/mermaid.min.js");
const MERMAID_PACKAGE = path.resolve(import.meta.dirname, "../node_modules/mermaid/package.json");
const HASH_MARKER = /<!-- mermaid-source-hash: ([0-9a-f]+) -->\s*$/;

const THEME_VARIABLES = {
  primaryColor: "#ffffff", // --color-surface
  primaryTextColor: "#171717", // --color-text
  primaryBorderColor: "#dfdfdc", // --color-line
  lineColor: "#626262", // --color-text-muted
  secondaryColor: "#ffffff",
  tertiaryColor: "#ffffff",
  background: "#f7f7f5", // --color-bg
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: "13px",
};

async function readExistingHash(outPath: string): Promise<string | undefined> {
  try {
    return HASH_MARKER.exec(await readFile(outPath, "utf-8"))?.[1];
  } catch {
    return undefined;
  }
}

async function openRenderer(): Promise<{ page: Page; close: () => Promise<void> }> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("about:blank");
  await page.addScriptTag({ path: MERMAID_BUNDLE });
  await page.evaluate((themeVariables) => {
    // @ts-expect-error -- mermaid is loaded as a global by the script tag above.
    window.mermaid.initialize({ startOnLoad: false, theme: "base", themeVariables });
  }, THEME_VARIABLES);
  return { page, close: () => browser.close() };
}

async function main() {
  const entries = await readdir(SRC_DIR, { withFileTypes: true });
  const sources = entries.filter((e) => e.isFile() && e.name.endsWith(".mmd"));

  if (sources.length === 0) {
    console.log("[render-mermaid] no .mmd sources found, skipping.");
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });

  const { version: mermaidVersion } = JSON.parse(await readFile(MERMAID_PACKAGE, "utf-8"));
  let renderer: Awaited<ReturnType<typeof openRenderer>> | undefined;

  for (const entry of sources) {
    const name = entry.name.replace(/\.mmd$/, "");
    // Normalize line endings: Windows checkouts (core.autocrlf) would otherwise hash differently from CI/Cloudflare.
    const source = (await readFile(path.join(SRC_DIR, entry.name), "utf-8")).replace(/\r\n/g, "\n");
    const outPath = path.join(OUT_DIR, `${name}.svg`);
    const hash = createHash("sha256")
      .update(JSON.stringify({ source, THEME_VARIABLES, mermaidVersion }))
      .digest("hex")
      .slice(0, 16);

    if ((await readExistingHash(outPath)) === hash) {
      console.log(`[render-mermaid] ${name}.svg is up to date, skipping.`);
      continue;
    }

    if (!renderer) {
      try {
        renderer = await openRenderer();
      } catch (err) {
        throw new Error(
          `${name}.svg is missing or stale and no Playwright browser is available here. ` +
            "Run `npm run render:diagrams` locally and commit public/diagrams/.",
          { cause: err },
        );
      }
    }

    const svg = await renderer.page.evaluate(
      async ({ source, id }) => {
        // @ts-expect-error -- global mermaid.
        const { svg } = await window.mermaid.render(id, source);
        return svg;
      },
      { source, id: `diagram-${name}` },
    );

    await writeFile(outPath, `${svg}
<!-- mermaid-source-hash: ${hash} -->
`, "utf-8");
    console.log(`[render-mermaid] wrote ${path.relative(process.cwd(), outPath)}`);
  }

  await renderer?.close();
}

main().catch((err) => {
  console.error("[render-mermaid] failed:", err);
  process.exit(1);
});
