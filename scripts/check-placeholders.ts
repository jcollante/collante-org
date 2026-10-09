/**
 * Launch gate: fails (exit 1) while placeholder content remains — TODO
 * markers in the built dist/ pages (text, comments, attributes) or in
 * src/lib/site.ts (unconfirmed contact details). Publishing a half-finished
 * template to www.collante.org risks web gateways classifying it as parked
 * or low-content, and that first category tends to stick — see plan.MD
 * Phase 12.2. Expected to fail until Phase 11 content lands, so CI runs it
 * as informational; make it blocking (and add it to the Cloudflare Pages
 * build command) once the site is ready for the real domain.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
const SOURCE_FILES = ["src/lib/site.ts"];
const MARKER = /\bTODO\b/;

async function findFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await findFiles(full)));
    else if (/\.(html|xml|txt)$/.test(entry.name)) files.push(full);
  }
  return files;
}

async function findMarkers(file: string): Promise<string[]> {
  const lines = (await readFile(file, "utf8")).split("\n");
  return lines.flatMap((line, i) => (MARKER.test(line) ? [`  ${i + 1}: ${line.trim().slice(0, 140)}`] : []));
}

async function main() {
  const files = [...(await findFiles(DIST_DIR)), ...SOURCE_FILES.map((f) => path.join(ROOT, f))];

  let count = 0;
  for (const file of files.sort()) {
    const hits = await findMarkers(file);
    if (hits.length === 0) continue;
    count += hits.length;
    console.error(`\n✗ ${path.relative(ROOT, file)}`);
    for (const hit of hits) console.error(hit);
  }

  if (count > 0) {
    console.error(`\n[check-placeholders] ${count} placeholder marker(s) — not ready for the real domain (plan.MD Phase 12.2).`);
    process.exit(1);
  }
  console.log("[check-placeholders] OK — no placeholder markers found.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
