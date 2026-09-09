# collante.ai — Implementation plan

## How to use this document

This is a working checklist, not a one-shot prompt. Save it as `PLAN.md` at the repo root and check items off (`- [x]`) as you go — either yourself or by asking a coding assistant to "do phase 3, then stop and let me review" one phase at a time. Each phase has a **Definition of Done** — don't move to the next phase until it's met. Commit after each phase; the suggested commit message is included so the Git history itself becomes a readable build log.

Do the phases roughly in order. Phase 12 (writing the actual launch content) is the longest and can run in parallel with phases 7–11 once phase 6 is done — you don't need SEO plumbing finished before you start writing an ADR.

---

## Phase 0 — Project setup

**Goal:** an empty Astro project that runs, with the exact dependency set and nothing extra.

- [ ] `npm create astro@latest .` — choose TypeScript strict, empty template, no example content.
- [ ] `npx astro add mdx`
- [ ] `npx astro add sitemap`
- [ ] `npm install @astrojs/rss zod shiki mermaid`
- [ ] `npm install -D @axe-core/playwright playwright`
- [ ] Confirm `astro.config.mjs` only lists the integrations above — no framework integrations (`@astrojs/react`, etc.) yet.
- [ ] Initialize Git, first commit.

**Definition of done:** `npm run dev` serves the default Astro welcome page with no errors, `package.json` dependencies match the approved list exactly.

**Commit:** `chore: initial Astro project scaffold`

---

## Phase 1 — Design tokens and global CSS

**Goal:** one canonical source of visual truth, wired into CSS.

- [ ] Create `design-tokens.json` at repo root with the color/font/spacing/contentWidth/diagram values.
- [ ] Create `src/styles/global.css` with `@layer reset, tokens, base, components;` and define CSS custom properties in the `tokens` layer from the JSON values (hand-transcribed is fine — a build-time import is unnecessary tooling for six colors and a spacing scale).
- [ ] Define the three content-width custom properties (`--width-narrow`, `--width-standard`, `--width-wide`) in the same layer.
- [ ] Add a CSS reset in the `reset` layer (box-sizing, margin removal, etc.).
- [ ] Import `global.css` once, in `BaseLayout.astro`.
- [ ] Self-host Inter (400/500/600) and IBM Plex Mono (400/500) as WOFF2 in `public/fonts/`, `@font-face` in the `base` layer, `font-display: swap`.

**Definition of done:** a blank page using `BaseLayout` renders with the correct background/text colors and both fonts loading, verified in the browser dev tools network tab (no FOUT/FOIT flash, no 404s on font files).

**Commit:** `feat: design tokens and global styling foundation`

---

## Phase 2 — Content collections and schemas

**Goal:** typed, validated content model with the `decisions`/`insights` split.

- [ ] Check the installed Astro version's current content API (Content Layer vs. legacy Content Collections) — use whichever is current and stable, not whichever this plan assumes.
- [ ] Create `src/content/config.ts` with the five collections (`architecture`, `accelerators`, `decisions`, `insights`, `lab`) and the Zod schemas from the build prompt.
- [ ] Create one placeholder entry in each collection folder with real (if minimal) frontmatter, so schema errors surface immediately rather than on the first real article.
- [ ] Run the Astro type-check / build and confirm a deliberately broken frontmatter field (e.g., invalid `patternTag`) fails the build with a clear error.

**Definition of done:** `npm run build` succeeds with five valid placeholder entries, and fails loudly when you temporarily break one on purpose (then fix it back).

**Commit:** `feat: content collections and schemas`

---

## Phase 3 — Core layout and navigation

**Goal:** the shell every page shares.

- [ ] `SiteHeader.astro`: site name (links to `/`, no "Home" label), nav (Architecture / Accelerators / Decisions / Insights / Lab / About), LinkedIn + email on the right.
- [ ] `SiteFooter.astro`: name, role, LinkedIn, email, GitHub (secondary, if included), current year.
- [ ] `BaseLayout.astro`: imports global CSS, renders header/footer, exposes a `<slot />` for page content, sets the narrow/standard/wide width as a prop.
- [ ] Wire `BaseLayout` into `src/pages/index.astro` with placeholder content to verify the shell.

**Definition of done:** every route (even empty stubs) renders a consistent header and footer with working links, keyboard-tabbable in a sensible order, visible focus states on every link.

**Commit:** `feat: base layout, header, and footer`

---

## Phase 4 — Diagram system

**Goal:** the three-tier diagram pipeline (custom SVG / Mermaid-at-build / HTML-CSS) with accessibility baked in.

- [ ] Build `Figure.astro`: accepts a caption, wraps children in `<figure>`, renders `role="img"` + `<title>`/`<desc>` when the child is SVG, optional slot for a "detailed text description" link.
- [ ] Write `scripts/render-mermaid.ts`: reads `.mmd` source files (or Mermaid code blocks in MDX via a remark plugin), renders to static SVG at build time using the theme values from `design-tokens.json`, outputs to `public/diagrams/`.
- [ ] Hand-author one flagship SVG diagram (the homepage "Enterprise Data & AI Platform" reference architecture) directly, styled from the same tokens.
- [ ] Build one example decision matrix as semantic HTML/CSS (a real `<table>` or CSS grid, not a diagram) to prove tier three works.
- [ ] Test all three diagram types with a screen reader (VoiceOver/NVDA) to confirm the caption and description are actually announced.

**Definition of done:** one working example of each of the three diagram tiers exists in the codebase, all wrapped in `Figure.astro`, all passing an axe accessibility check.

**Commit:** `feat: diagram system — custom SVG, build-time Mermaid, HTML/CSS tier`

---

## Phase 5 — Article components and layout

**Goal:** the shared machinery every content page uses.

- [ ] `AdrMeta.astro`: renders `ADR·007` styling, status, and clickable supersession links — used only in `decisions/[slug].astro`.
- [ ] `TagList.astro`: renders pattern/stack tags as text + thin border, linking to `/tags/[tag]`.
- [ ] `ArticleLayout.astro`: narrow content width, canonical URL, OG meta tags, JSON-LD (`TechArticle` or the closer-fitting type), renders `TagList` and (for decisions) `AdrMeta`.
- [ ] Build `src/pages/tags/[tag].astro` — a static list of everything sharing a tag, generated via `getStaticPaths()`.

**Definition of done:** a single real article in each of the five collections renders through `ArticleLayout`, with correct meta tags (check via browser view-source), and tag pages list the right content.

**Commit:** `feat: article layout, ADR metadata, and tag pages`

---

## Phase 6 — Index/listing pages and homepage

**Goal:** every collection has a working index, and the homepage is assembled in the correct order.

- [ ] Build `index.astro` for each of `architecture/`, `accelerators/`, `decisions/`, `insights/`, `lab/` — simple, editorial lists (title, date, one-line description, tags), sorted sensibly (decisions by number, others by date).
- [ ] Build `about.astro` with the credibility strip (certifications, notable engagement scale, speaking/publications) — kept to one screen, not a résumé.
- [ ] Assemble `index.astro` (homepage) in this order: header → hero (point of view first) → selected architecture (wide, flagship diagram) → editorial content-area list → 3–5 selected decisions → 1–2 latest insights → About excerpt → footer.
- [ ] Write the actual hero point-of-view copy now, not a placeholder — this is the single highest-leverage sentence on the site.

**Definition of done:** every nav link resolves to a real, populated page; the homepage reads correctly top to bottom with the placeholder content in place; nothing on the homepage is a chronological "everything" feed.

**Commit:** `feat: collection index pages and homepage assembly`

---

## Phase 7 — SEO plumbing

**Goal:** independent discoverability for every article.

- [ ] Confirm `@astrojs/sitemap` output at `/sitemap-index.xml`.
- [ ] Add an RSS feed via `@astrojs/rss` at `/rss.xml`.
- [ ] Add `public/robots.txt` referencing the sitemap.
- [ ] Add `Person` JSON-LD to the homepage and About page.
- [ ] Verify Open Graph tags render correctly by testing a real article URL through a social-preview debugger (LinkedIn Post Inspector or similar).
- [ ] Note (don't build yet): automated OG image generation is V1.5 — a static, hand-made default OG image is fine for launch.

**Definition of done:** sitemap and RSS both validate, robots.txt is correct, and a real article link previews acceptably when pasted into LinkedIn's post composer (test with an unpublished/unlisted draft if you don't want it public yet).

**Commit:** `feat: sitemap, RSS, robots.txt, and structured data`

---

## Phase 8 — Validation and CI

**Goal:** the guardrails from the spec become enforced, not just documented.

- [ ] Write `scripts/validate-adr-links.ts`: fails if any `decisionNumber` is duplicated, or any `supersedes`/`supersededBy` points to a nonexistent decision. Run it as part of `npm run build`.
- [ ] Write `CONTENT_GUIDELINES.md` with the confidentiality/IP rule verbatim.
- [ ] Add a GitHub Actions workflow: on push, run `npm run build`, then `axe-playwright` against the built output, then fail the workflow on any accessibility violation above a set severity.
- [ ] Add a basic Lighthouse CI step (or a manual pre-launch Lighthouse run if you'd rather not automate it yet) targeting 95+ across all four categories.

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
