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

const decisions = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/decisions" }),
  schema: z.object({
    ...baseFields,
    decisionNumber: z.number().int().positive(),
    decisionStatus: z.enum(["proposed", "accepted", "superseded", "deprecated"]).default("accepted"),
    context: z.string().min(1),
    options: z.array(z.string()).min(2),
    recommendation: z.string().min(1),
    supersedes: z.number().int().positive().optional(),
    supersededBy: z.number().int().positive().optional(),
  }),
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
