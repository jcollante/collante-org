# Content guidelines

## Confidentiality and IP — non-negotiable

Published architecture content must be based on:

- public knowledge;
- personal analysis;
- independently created generic reference architectures;
- publicly documented technology capabilities.

Never publish:

- confidential client names;
- client data;
- client screenshots;
- internal client architecture;
- credentials;
- environment identifiers;
- proprietary employer material;
- internal consulting templates;
- confidential methodologies;
- restricted documents;
- information copied from confidential engagements.

If professional experience inspires a topic, generalize the problem and independently reconstruct the
architecture from public concepts.

The site must demonstrate experience without exposing client or employer intellectual property.

## Tone

Writing should sound: experienced, precise, analytical, calm, opinionated when evidence supports it,
aware of trade-offs.

Avoid: hype, self-congratulation, marketing clichés, excessive adjectives, artificial certainty, "10x"
language, "revolutionary", "game-changing", "unlock", "transform your business", "thought leader".

Prefer: "This pattern reduces operational coupling, but introduces another governance boundary." over
"This innovative solution unlocks unprecedented enterprise agility."

## Tables

Wrap every table — markdown syntax or raw HTML — in `<Figure variant="table">`, not as a bare table in
the body. Figure gives it the horizontal-scroll safety net for narrow viewports and a real caption;
without it, a wide table just overflows the page on mobile with no way to reach the rest of it. Visual
styling (header rule, row dividers, alignment) is universal — it's centralized in `ArticleLayout`'s
`.article__body` and applies to any table automatically — but the *Figure wrapper itself* is not
automatic, so add it explicitly. Remember to `import Figure from "../../components/Figure.astro"` at the
top of the MDX file, and leave a blank line before and after a markdown-syntax table inside `<Figure>`
— MDX needs it to parse the table as markdown rather than JSX children text.

## Before publishing, check every piece against

- [ ] Nothing in this piece could identify a specific client, employer engagement, or confidential project.
- [ ] Every architecture pattern is independently reconstructed from public concepts, not copied from a
      real internal document.
- [ ] The tone matches the section above — no hype language, no inflated claims.
- [ ] Decisions (ADRs) include a genuine "what I'd reconsider" section — not just a one-sided recommendation.
- [ ] `status: published` is set only when the piece is actually ready to be public (drafts stay
      `status: draft` and are excluded from production listings and routes automatically).
- [ ] Tag counts stay restrained (a handful of pattern/stack tags, not every tag that could plausibly apply).
- [ ] `npm run build` passes, including the ADR integrity check for decisions.
