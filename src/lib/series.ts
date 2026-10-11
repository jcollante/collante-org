/**
 * Multi-part series, keyed by the id an entry references in its `series`
 * frontmatter. Planned parts are listed here so a series page can show the
 * full outline; SeriesNav only links a part once a published entry claims
 * it, so planned parts never produce dead links.
 */
export const series = {
  "databricks-streamlit-production": {
    title: "Beyond Hello World: Building Production-Ready Streamlit Apps on Databricks",
    parts: [
      { part: 1, title: "Architecture, Error Handling, and Observability" },
      { part: 2, title: "Identity, Roles, and Unity Catalog Authorization" },
      { part: 3, title: "Deployment, Concurrency, and Production Validation" },
    ],
  },
} as const;

export type SeriesId = keyof typeof series;

export const seriesIds = Object.keys(series) as [SeriesId, ...SeriesId[]];
