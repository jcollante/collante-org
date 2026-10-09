# collante.org

Personal site for Jonatan Collante — Data & AI Architect. A static, zero-client-JS Astro site built around five content collections (Architecture, Accelerators, Decisions, Insights, Lab) plus an About page.

## Status

Build is complete through Phase 10 of [`plan.MD`](plan.MD) — design tokens, content collections/schemas, base layout, the three-tier diagram system, article/index pages, SEO plumbing, CI, deployment config, and a performance/accessibility pass — plus a Phase 10.5 design-review round done after actually looking at the rendered pages. Phase 11 (real launch content) hasn't started: every collection currently holds one placeholder-quality sample entry.

Known blockers before launch (tracked in `plan.MD`):

- Real LinkedIn URL and contact email — `src/lib/site.ts` has TODO placeholders.
- Connecting the repo to Cloudflare Pages, DNS, and analytics (Phase 9) — needs real account access this environment doesn't have.
- Real launch content: 3 architecture pieces, 2 accelerators, 5 ADRs, 2 insights, 2 lab pieces (Phase 11).

`plan.MD` is the source of truth for what's done and why — read it before making structural changes.

## Project structure

```text
/
├── public/                  # fonts, favicons, robots.txt, _headers, rendered diagram SVGs
├── scripts/
│   ├── render-mermaid.ts    # build-time Mermaid → static SVG (prebuild step)
│   └── check-a11y.ts        # crawls dist/ and runs axe against every generated page
├── src/
│   ├── components/          # Figure, ArticleCard, FeaturedEntry, TagList, AdrMeta, Site*, diagrams/
│   ├── content/              # the 5 collections: architecture, accelerators, decisions, insights, lab
│   ├── content.config.ts    # Zod schemas + ADR-integrity checks (duplicate numbers, dangling links)
│   ├── diagrams/             # .mmd Mermaid sources
│   ├── layouts/              # BaseLayout, ArticleLayout
│   ├── lib/                   # site.ts (nav/config), content.ts (listing helpers), personJsonLd.ts
│   ├── pages/                 # index, about, and each collection's index + [slug] routes
│   └── styles/                # tokens.css, global.css
├── plan.MD                  # phase-by-phase build log and decisions — read this first
└── CONTENT_GUIDELINES.md    # confidentiality/IP rules, tone, pre-publish checklist
```

## Commands

All commands run from the repo root.

| Command                  | Action                                                        |
| :------------------------ | :------------------------------------------------------------ |
| `npm install`             | Install dependencies                                           |
| `npm run dev`              | Start the local dev server                                     |
| `npm run build`            | Render Mermaid diagrams, then build the production site to `./dist/` |
| `npm run preview`          | Preview the production build locally                           |
| `npm run render:diagrams` | Re-render `.mmd` sources to static SVG only                    |
| `npm run check`            | Type-check, including `.astro` files (`astro check`)           |
| `npm run test:a11y`        | Crawl `dist/` and run axe against every generated page          |
| `npm run validate:content` | Run `astro sync`, which also triggers the ADR-integrity check |

CI (`.github/workflows/ci.yml`) runs type-check → build → accessibility check → a non-blocking Lighthouse pass on every push/PR.

## Content

Five collections live under `src/content/`: `architecture`, `accelerators`, `decisions` (ADRs, numbered and cross-linkable via `supersedes`/`supersededBy`), `insights`, `lab`. Schemas and the ADR-integrity check (duplicate `decisionNumber`, dangling supersession links) live in `src/content.config.ts` and run on every `dev`, `build`, and `sync`. Draft/archived entries are excluded from production listings and routes automatically — see `src/lib/content.ts`.

Before publishing anything, check it against [`CONTENT_GUIDELINES.md`](CONTENT_GUIDELINES.md): confidentiality/IP rules (no client names, no client data, no proprietary employer material), tone guidance, the table-wrapping convention, and a pre-publish checklist.
