# collante.ai — Implementation plan

## How to use this document

This is a working checklist, not a one-shot prompt. Save it as `PLAN.md` at the repo root and check items off (`- [x]`) as you go — either yourself or by asking a coding assistant to "do phase 3, then stop and let me review" one phase at a time. Each phase has a **Definition of Done** — don't move to the next phase until it's met. Commit after each phase; the suggested commit message is included so the Git history itself becomes a readable build log.

Do the phases roughly in order. Phase 12 (writing the actual launch content) is the longest and can run in parallel with phases 7–11 once phase 6 is done — you don't need SEO plumbing finished before you start writing an ADR.

---

## Phase 0 — Project setup

**Goal:** an empty Astro project that runs, with the exact dependency set and nothing extra.

- [x] `npm create astro@latest .` — choose TypeScript strict, empty template, no example content.
- [x] `npx astro add mdx`
- [x] `npx astro add sitemap`
- [x] `npm install @astrojs/rss zod shiki mermaid`
- [x] `npm install -D @axe-core/playwright playwright`
- [x] Confirm `astro.config.mjs` only lists the integrations above — no framework integrations (`@astrojs/react`, etc.) yet.
- [x] Initialize Git, first commit.

**Definition of done:** `npm run dev` serves the default Astro welcome page with no errors, `package.json` dependencies match the approved list exactly.

**Commit:** `chore: initial Astro project scaffold`

---

## Phase 1 — Design tokens and global CSS

**Goal:** one canonical source of visual truth, wired into CSS.

- [x] Create `src/styles/tokens.css` at as the canonical token source (superseding the `design-tokens.json` idea — see the full build spec appended below; a `tokens` CSS layer is simpler than a JSON→CSS build step for this token count).
- [x] Create `src/styles/global.css` with `@layer reset, tokens, base, components;` and define CSS custom properties in the `tokens` layer via `@import "./tokens.css" layer(tokens)`.
- [x] Define the three content-width custom properties (`--width-reading`, `--width-standard`, `--width-wide`) in the same layer.
- [x] Add a CSS reset in the `reset` layer (box-sizing, margin removal, etc.).
- [x] Import `global.css` once, in `BaseLayout.astro`.
- [x] Self-host Inter (400/500, variable WOFF2, latin subset) and IBM Plex Mono (400, latin subset) in `public/fonts/`, `@font-face` in the `base` layer, `font-display: swap`. (Spec's font section calls for weights 400/500 only, not 600.)

**Definition of done:** a blank page using `BaseLayout` renders with the correct background/text colors and both fonts loading, verified in the browser dev tools network tab (no FOUT/FOIT flash, no 404s on font files).

**Commit:** `feat: design tokens and global styling foundation`

---

## Phase 2 — Content collections and schemas

**Goal:** typed, validated content model with the `decisions`/`insights` split.

- [x] Check the installed Astro version's current content API (Content Layer vs. legacy Content Collections) — use whichever is current and stable, not whichever this plan assumes. (Astro 7.3 — Content Layer API, `glob()` loaders, config at `src/content.config.ts` per the build spec's repo structure.)
- [x] Create `src/content.config.ts` with the five collections (`architecture`, `accelerators`, `decisions`, `insights`, `lab`) and the Zod schemas from the build spec.
- [x] Create one real (if concise, layout-validation-purpose) sample entry in each collection folder, using the exact filenames from the build spec's §42: `enterprise-data-ai-platform.mdx`, `databricks-production-readiness.mdx`, `adr-001-single-vs-multi-agent.mdx`, `governance-as-architecture.mdx`, `private-hybrid-ai-development.mdx`. Generic/public-knowledge content only, no fabricated client claims.
- [x] Run the Astro build and confirm a deliberately broken frontmatter field (invalid `patternTag`) fails the build with a clear error — confirmed (`InvalidContentEntryDataError`), then reverted.
- [x] Added `src/lib/content.ts` centralizing draft/archive listing rules (build spec §14) — `isListable`, `isBuildable`, `sortByDateDesc`, shared by every future listing/route.

**Definition of done:** `npm run build` succeeds with five valid placeholder entries, and fails loudly when you temporarily break one on purpose (then fix it back).

**Commit:** `feat: content collections and schemas`

---

## Phase 3 — Core layout and navigation

**Goal:** the shell every page shares.

- [x] `SiteHeader.astro`: site name (links to `/`, no "Home" label), nav — per the build spec §11 the top nav is **Architecture / Accelerators / Insights / Lab / About** (Decisions is a real, distinct collection but deliberately not a top-nav item — it's surfaced from the homepage and cross-linked from Insights/Architecture instead), LinkedIn + email on the right. Mobile nav uses a zero-JS `<details>/<summary>` disclosure (keyboard-tested: opens on Enter, focus moves into the panel).
- [x] `SiteFooter.astro`: name, role, LinkedIn, email, GitHub (secondary, only rendered if `siteConfig.githubUrl` is set), current year via `new Date().getFullYear()`.
- [x] `BaseLayout.astro`: imports global CSS, renders header/footer, skip-to-content link, exposes a `<slot />` for page content, optional `width` prop (reading/standard/wide) wraps the slot in a `.container--*`; composite pages (homepage) manage per-section containers themselves instead.
- [x] Wire `BaseLayout` into `src/pages/index.astro` with placeholder content to verify the shell.
- [x] Verified via Playwright: tab order is skip-link → header → footer in a sensible sequence, mobile disclosure opens via keyboard, focus-visible outlines render, 0 axe violations.
- [ ] **Blocked on real values** — `src/lib/site.ts` has placeholder LinkedIn URL and email (`hello@collante.ai`); need the real LinkedIn profile URL and the contact email to publish, and whether to include a GitHub link.

**Definition of done:** every route (even empty stubs) renders a consistent header and footer with working links, keyboard-tabbable in a sensible order, visible focus states on every link.

**Commit:** `feat: base layout, header, and footer`

---

## Phase 4 — Diagram system

**Goal:** the three-tier diagram pipeline (custom SVG / Mermaid-at-build / HTML-CSS) with accessibility baked in.

- [x] Build `Figure.astro`: accepts a caption, wraps children in `<figure>`. `variant="diagram"` (default) wraps content in a `role="img"` div carrying the accessible name (`aria-label`) and, when a `description` is given, an `aria-describedby` link to a `<details>` "Detailed description" disclosure. `variant="table"` skips the role="img" wrapper entirely — a semantic `<table>` keeps its own table semantics, never flattened into "image" (per build spec §32).
- [x] Write `scripts/render-mermaid.ts`: reads `.mmd` sources from `src/diagrams/`, renders to static SVG at build time by driving the real `mermaid` package inside a headless Playwright page (mermaid needs a DOM; this avoids adding `@mermaid-js/mermaid-cli`/puppeteer as a new dependency since `mermaid` + `playwright` are already in the approved stack), outputs to `public/diagrams/`. Wired into `npm run build` as a prebuild step; theme colors hand-transcribed from `tokens.css` with a comment to keep them in sync.
- [x] Hand-authored the flagship SVG diagram (`EnterpriseDataAiPlatform.astro`) directly as inline SVG — Sources → Ingestion → Data Platform (Unity Catalog governance boundary, accent-colored per spec §29) → Data Products → Consumption. `role="presentation"` on the SVG itself since the parent Figure's wrapper div owns the single accessible name (avoids a double/competing accessible name).
- [x] Built one example decision matrix as a real semantic `<table>` (ADR·001, single-agent vs. multi-agent by criterion), wrapped in `Figure` with `variant="table"`.
- [x] Verified all three tiers with axe (0 violations attributable to the diagrams/tables; the one flagged issue was a test-harness artifact — a scratch page with no `<h1>` — unrelated to the diagram system) and confirmed programmatically that each diagram exposes a distinct `role="img"` + `aria-label` while the table keeps native table semantics with no `role="img"` wrapper. (Manual VoiceOver/NVDA spot-check deferred to Phase 10's full screen-reader pass, once real article pages exist in Phase 5 to test against.)

**Definition of done:** one working example of each of the three diagram tiers exists in the codebase, all wrapped in `Figure.astro`, all passing an axe accessibility check.

**Commit:** `feat: diagram system — custom SVG, build-time Mermaid, HTML/CSS tier`

---

## Phase 5 — Article components and layout

**Goal:** the shared machinery every content page uses.

- [x] `AdrMeta.astro`: renders `ADR·007`-style id, status, and clickable supersession links (resolved from `decisionNumber` to the target's slug via `getCollection("decisions")`) — imported by `ArticleLayout` and only ever activated by `decisions/[slug].astro` passing its `adr` prop.
- [x] `TagList.astro`: renders pattern tags (sans, uppercase) and stack tags (mono, matching the "technical identifier" convention) as text + thin border, linking to `/tags/[tag]/`.
- [x] `ArticleLayout.astro`: canonical URL, OG meta tags, `TechArticle` JSON-LD, renders `TagList` and (conditionally, for decisions) `AdrMeta`. Reading-width is applied per-child (`.article__body > :not(figure)`) rather than to the whole article, so `Figure`'s own wide/standard variants render correctly without fighting a breakout hack against Figure's scoped max-width.
- [x] Built `[slug].astro` for all five collections (`isBuildable` filtered — drafts excluded from production paths, archived still addressable) and `src/pages/tags/[tag].astro` via `getStaticPaths()`, aggregating pattern+stack tags across all five collections' `isListable` (published-only) entries.
- [x] Verified: meta tags/canonical/OG/JSON-LD all correct via view-source; axe run against all 5 real article pages + a tag page — 0 violations on every one.

**Definition of done:** a single real article in each of the five collections renders through `ArticleLayout`, with correct meta tags (check via browser view-source), and tag pages list the right content.

**Commit:** `feat: article layout, ADR metadata, and tag pages`

---

## Phase 6 — Index/listing pages and homepage

**Goal:** every collection has a working index, and the homepage is assembled in the correct order.

- [x] Built `index.astro` for each of `architecture/`, `accelerators/`, `decisions/`, `insights/`, `lab/`. Architecture uses the spec §22 numbered-editorial format (diagram thumbnails omitted — no preview-image field in the schema, not worth adding for one entry); the other four use a shared `ArticleCard.astro`; decisions sorted by `decisionNumber` desc, others by date desc, all via the Phase 2 `isListable`/`sortByDateDesc` helpers.
- [x] Built `about.astro` — structurally complete but **explicitly TODO-marked** where I can't fabricate real content: positioning statement, experience narrative, areas of expertise, certifications, and portrait are all placeholder text pending the real bio (name/role are real, from the build spec). Kept to one screen, no skill bars/progress bars/chronological CV.
- [x] Assembled homepage in the exact spec order: header → hero → selected architecture (wide, flagship diagram) → areas of practice (numbered editorial row, not cards) → selected decisions (typographic, no cards/thumbnails) → latest insights → About excerpt → footer. Selection uses the `featured` schema field rather than "latest N" so homepage curation is deliberate.
- [x] Used the build spec's own point-of-view hero copy verbatim (§16's "architectural thesis" alternative — governance/reliability/operability as architectural properties, not afterthoughts) since it's real authored copy, not a placeholder, and it echoes the Insights piece's theme.
- [x] Fixed a real mobile issue found via screenshot: the flagship diagram shrank to illegible text at narrow viewports. `Figure.astro` now gives diagram media a 40rem legible floor with `overflow-x: auto`, so it scrolls horizontally instead of shrinking past readability (spec §10: prefer responsive viewBox scaling, horizontal scroll only as a last resort).
- [x] Verified: all 25 pages build, 0 axe violations and 0 failed requests across homepage + all 5 index pages + About, confirmed visually via full-page screenshots at desktop and mobile widths.

**Definition of done:** every nav link resolves to a real, populated page; the homepage reads correctly top to bottom with the placeholder content in place; nothing on the homepage is a chronological "everything" feed.

**Commit:** `feat: collection index pages and homepage assembly`

---

## Phase 7 — SEO plumbing

**Goal:** independent discoverability for every article.

- [x] Confirmed `@astrojs/sitemap` output at `/sitemap-index.xml` (valid, references `/sitemap-0.xml`).
- [x] Added `src/pages/rss.xml.ts` aggregating all five collections' published entries, sorted newest-first — validated the actual XML output by hand, correct.
- [x] Added `public/robots.txt` referencing the sitemap.
- [x] Added `Person` JSON-LD (`src/lib/personJsonLd.ts`, shared) to the homepage and About page — verified programmatically via the rendered `<script type="application/ld+json">`.
- [x] Built a real static default OG image (`public/og-default.png`, 1200×630) — rendered from an HTML mockup via Playwright screenshot at exact dimensions, using the real self-hosted fonts (base64-embedded so the headless render actually picks them up — `file://` `@font-face` sources don't reliably load in headless Chromium, and `document.fonts.ready` confirmed load status before the screenshot). Wired into every page's OG meta tags.
- [ ] **Deferred to Phase 9** — verifying Open Graph tags through a live social-preview debugger (LinkedIn Post Inspector) needs a real publicly-reachable URL, which doesn't exist until deployment. Meta tag correctness (title/description/type/url/image, canonical, JSON-LD) already verified directly via rendered HTML for both articles and the homepage/About.

**Definition of done:** sitemap and RSS both validate, robots.txt is correct, and a real article link previews acceptably when pasted into LinkedIn's post composer (test with an unpublished/unlisted draft if you don't want it public yet).

**Commit:** `feat: sitemap, RSS, robots.txt, and structured data`

---

## Phase 8 — Validation and CI

**Goal:** the guardrails from the spec become enforced, not just documented.

- [x] **Deviation from the literal filename**: ADR integrity checking (duplicate `decisionNumber`, dangling `supersedes`/`supersededBy`, inconsistent reciprocal links) lives in `src/content.config.ts` as a custom loader wrapping `glob()`, not a standalone `scripts/validate-adr-links.ts`. Reason: `astro:content`'s `getCollection` isn't reliably usable from a plain Node script outside Astro's own build/dev graph, while a loader runs automatically on every `npm run build`, `npm run dev`, and `astro sync` — the existing Astro/TypeScript mechanism the build spec §43 explicitly asks for, rather than a separate validation framework. Tested both failure modes directly (duplicate number, dangling reference) — both fail the build with a clear, specific message; reverted after confirming.
- [x] Wrote `CONTENT_GUIDELINES.md` with the confidentiality/IP rule verbatim from the build spec, plus a tone section and a pre-publish checklist.
- [x] Added `.github/workflows/ci.yml`: type-check (`astro check`) → build (Mermaid render + ADR integrity via content sync) → `scripts/check-a11y.ts`, a general crawler that walks every generated page in `dist/` (not a hardcoded URL list) and runs axe against each, failing on any "serious"/"critical" violation (minor/moderate log as warnings, non-blocking).
- [x] Added a Lighthouse CI step (`treosh/lighthouse-ci-action`, no new npm dependency) — **non-blocking for now** (`continue-on-error: true`): it runs against local `astro preview`, not real network conditions, and content/images are still placeholder-quality. Becomes a hard gate once Phase 10 validates real 95+ scores against the deployed site.
- [x] Added `@astrojs/check` + `typescript` as dev dependencies — required to actually enforce the TypeScript strict mode already mandated in Phase 0 (`tsc` alone can't type-check `.astro` files; nothing already in the approved stack does this). `astro check` caught a real bug in the process: `src/lib/content.ts`'s generic helpers inferred through `CollectionEntry<C>` (an indexed-access type) silently widened to the union of every collection's shape at several call sites, which `entry.data.insightType`-style access then failed on. Fixed by typing those helpers structurally against `{ data: { status } }`/`{ data: { date } }` instead — simpler and correctly preserves the full input type.

**Definition of done:** pushing a branch with a duplicate ADR number, or an accessibility regression, fails CI before it can reach `main`.

**Commit:** `ci: build validation, accessibility checks, ADR integrity`

---

## Phase 9 — Deployment

**Goal:** `collante.ai` resolves to the built site with no manual steps after `git push`.

- [ ] Connect the GitHub repo to Cloudflare Pages, framework preset "Astro."
- [ ] Add `public/_headers` with CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- [ ] Point the domain's DNS at Cloudflare Pages, enable HSTS and DNSSEC.
- [ ] Enable Cloudflare Web Analytics (the JS snippet or the Cloudflare-native option with no client-side script, if available on your plan).
- [ ] Do a full production build locally (`npm run build && npm run preview`) and click through every page before the first real deploy.

**Definition of done:** pushing to `main` produces a live deployment at `collante.ai` within a few minutes, with correct security headers (check via `curl -I` or an online header checker) and analytics recording a real pageview.

**Commit:** `chore: deployment configuration and security headers`

---

## Phase 10 — Performance and accessibility pass

**Goal:** hit the Lighthouse targets for real, not just in theory.

- [ ] Run Lighthouse against the deployed production site (not localhost — real network conditions matter for fonts/images).
- [ ] Fix any CLS from font loading (check preload is only on the one critical weight, per the spec).
- [ ] Confirm zero client-side Mermaid runtime is shipped (check the network tab for `mermaid` in any JS bundle — there shouldn't be one).
- [ ] Manually tab through the entire site with a keyboard only, no mouse — every interactive element must be reachable and show a visible focus state.
- [ ] Test with a screen reader on at least the homepage, one article, and one diagram-heavy page.

**Definition of done:** Lighthouse Performance/Accessibility/Best Practices/SEO all ≥95 on the deployed site, and the manual keyboard/screen-reader pass turns up no dead ends.

**Commit:** `perf: font loading, CLS, and accessibility fixes`

---

## Phase 11 — Launch content

**Goal:** meet the minimum content bar before announcing the site anywhere. This is the phase that actually determines whether the site reads as an authority or an empty template — budget real time for it, and don't rush it to match the coding phases' pace.

- [ ] 3 Architecture pieces (reference architectures), each with at least one custom SVG or build-time Mermaid diagram, cross-tagged on both pattern and stack.
- [ ] 2 Accelerators, each with maturity dimensions and architecture domains filled in meaningfully (not placeholder enums).
- [ ] 5 Decisions (ADRs), numbered sequentially, each with a genuine "what I'd reconsider" counterargument section, not just a one-sided recommendation.
- [ ] 2 Insights (long-form essays, no ADR fields).
- [ ] 2 Lab pieces.
- [ ] The homepage hero copy finalized as an actual opinion (revisit Phase 6's draft with fresh eyes).
- [ ] A short Principles section/page if you decide to add it — a handful of durable architectural positions, separate from any single ADR.
- [ ] Every piece checked against `CONTENT_GUIDELINES.md` before publishing.

**Definition of done:** the site has enough real, cross-tagged content that the tag pages and homepage selections feel curated rather than sparse — this is a judgment call, not a checkbox, but "does this look like an archive or a template" is the test.

**Commit:** `content: initial launch set — architecture, accelerators, decisions, insights, lab`

---

## After launch (not part of this plan)

Pagefind search, automated OG image generation, content freshness checks, and the interactive Architecture Decision Navigator are V1.5/V2 — deliberately not in this plan. Revisit them once the site has been live long enough to know whether they're actually needed, not because they were in the original spec.
