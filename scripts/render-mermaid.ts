/**
 * Build-time Mermaid → static SVG rendering (diagram tier 2).
 *
 * Reads every .mmd source file in src/diagrams/, renders it to SVG using
 * the real `mermaid` package running inside a headless Playwright page
 * (mermaid's renderer needs a DOM), and writes the result to
 * public/diagrams/<name>.svg. No Mermaid JS ever ships to the browser —
 * this script runs at build time only, invoked from `npm run build`.
 *
 * Theme colors are hand-transcribed from src/styles/tokens.css. Mermaid's
 * themeVariables need literal color strings, not CSS custom properties, so
 * keep these in sync if tokens.css changes.
 */
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const SRC_DIR = path.resolve(import.meta.dirname, "../src/diagrams");
const OUT_DIR = path.resolve(import.meta.dirname, "../public/diagrams");
const MERMAID_BUNDLE = path.resolve(import.meta.dirname, "../node_modules/mermaid/dist/mermaid.min.js");

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

async function main() {
  const entries = await readdir(SRC_DIR, { withFileTypes: true });
  const sources = entries.filter((e) => e.isFile() && e.name.endsWith(".mmd"));

  if (sources.length === 0) {
    console.log("[render-mermaid] no .mmd sources found, skipping.");
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("about:blank");
  await page.addScriptTag({ path: MERMAID_BUNDLE });
  await page.evaluate((themeVariables) => {
    // @ts-expect-error -- mermaid is loaded as a global by the script tag above.
    window.mermaid.initialize({ startOnLoad: false, theme: "base", themeVariables });
  }, THEME_VARIABLES);

  for (const entry of sources) {
    const name = entry.name.replace(/\.mmd$/, "");
    const source = await readFile(path.join(SRC_DIR, entry.name), "utf-8");

    const svg = await page.evaluate(
      async ({ source, id }) => {
        // @ts-expect-error -- global mermaid.
        const { svg } = await window.mermaid.render(id, source);
        return svg;
      },
      { source, id: `diagram-${name}` },
    );

    const outPath = path.join(OUT_DIR, `${name}.svg`);
    await writeFile(outPath, svg, "utf-8");
    console.log(`[render-mermaid] wrote ${path.relative(process.cwd(), outPath)}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error("[render-mermaid] failed:", err);
  process.exit(1);
});
