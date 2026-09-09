import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const contentStatus = z.enum(["draft", "published", "archived"]);

const patternTag = z.enum([
  "platform-architecture",
  "lakehouse-governance",
  "data-engineering",
  "data-governance",
  "agentic-ai",
  "agentic-orchestration",
  "rag",
  "mlops",
  "finops",
  "observability",
  "platform-engineering",
  "application-architecture",
  "integration",
  "security",
]);

const stackTag = z.enum([
  "technology-agnostic",
  "databricks",
  "azure",
  "snowflake",
  "open-source",
]);

const baseFields = {
  title: z.string().min(1),
  description: z.string().min(1).max(160),
  date: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  status: contentStatus.default("draft"),
  featured: z.boolean().default(false),
  patternTags: z.array(patternTag).default([]),
  stackTags: z.array(stackTag).default([]),
};

const architecture = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/architecture" }),
  schema: z.object({
    ...baseFields,
    architectureType: z.enum(["reference", "target", "conceptual", "integration", "platform"]),
    audience: z.array(z.string()).default([]),
  }),
});

const accelerators = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/accelerators" }),
  schema: z.object({
    ...baseFields,
    maturityDimensions: z
      .array(
        z.enum([
          "governance",
          "automation",
          "observability",
          "scalability",
          "security",
          "operability",
          "cost",
        ]),
      )
      .default([]),
    architectureDomains: z.array(z.string()).default([]),
  }),
});

const decisionSchema = z.object({
  ...baseFields,
  decisionNumber: z.number().int().positive(),
  decisionStatus: z.enum(["proposed", "accepted", "superseded", "deprecated"]).default("accepted"),
  context: z.string().min(1),
  options: z.array(z.string()).min(2),
  recommendation: z.string().min(1),
  supersedes: z.number().int().positive().optional(),
  supersededBy: z.number().int().positive().optional(),
});

/**
 * Wraps the plain glob loader with cross-entry ADR integrity checks —
 * duplicate decisionNumbers, dangling supersedes/supersededBy references,
 * and inconsistent reciprocal links. A single entry's Zod schema can't see
 * across entries, so this can't be expressed as schema validation; it runs
 * here (rather than as a standalone script) because astro:content's
 * getCollection isn't reliably usable outside Astro's own build/dev graph,
 * while a loader runs automatically on every build, dev, and `astro sync` —
 * the plain existing mechanism the build spec (§43) asks for, no separate
 * validation framework needed.
 */
const decisionsGlobLoader = glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/decisions" });

const decisions = defineCollection({
  loader: {
    name: "decisions-with-adr-integrity",
    load: async (context) => {
      await decisionsGlobLoader.load(context);

      interface DecisionData {
        decisionNumber: number;
        supersedes?: number;
        supersededBy?: number;
      }
      const entries = context.store.values() as unknown as Array<{ id: string; data: DecisionData }>;
      const byNumber = new Map<number, string[]>();
      for (const entry of entries) {
        const num = entry.data.decisionNumber;
        byNumber.set(num, [...(byNumber.get(num) ?? []), entry.id]);
      }

      const errors: string[] = [];

      for (const [num, ids] of byNumber) {
        if (ids.length > 1) {
          errors.push(`decisionNumber ${num} is used by multiple decisions: ${ids.join(", ")}`);
        }
      }

      for (const entry of entries) {
        const { id, data } = entry;
        if (data.supersedes !== undefined && !byNumber.has(data.supersedes)) {
          errors.push(`${id}: supersedes ${data.supersedes}, which doesn't exist`);
        }
        if (data.supersededBy !== undefined && !byNumber.has(data.supersededBy)) {
          errors.push(`${id}: supersededBy ${data.supersededBy}, which doesn't exist`);
        }
        if (data.supersedes !== undefined) {
          const targetIds = byNumber.get(data.supersedes) ?? [];
          const target = entries.find((e) => targetIds.includes(e.id));
          if (target && target.data.supersededBy !== data.decisionNumber) {
            errors.push(
              `${id} (ADR·${data.decisionNumber}) claims to supersede ADR·${data.supersedes}, but ${target.id} doesn't set supersededBy: ${data.decisionNumber}`,
            );
          }
        }
      }

      if (errors.length > 0) {
        throw new Error(`ADR integrity check failed:\n  - ${errors.join("\n  - ")}`);
      }
    },
  },
  schema: decisionSchema,
});

const insights = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/insights" }),
  schema: z.object({
    ...baseFields,
    insightType: z.enum(["perspective", "deep-dive", "comparison", "guide"]).default("perspective"),
  }),
});

const lab = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/lab" }),
  schema: z.object({
    ...baseFields,
    experimentStatus: z
      .enum(["idea", "experimental", "prototype", "complete", "archived"])
      .default("experimental"),
  }),
});

export const collections = { architecture, accelerators, decisions, insights, lab };
