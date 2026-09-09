/**
 * Centralizes draft/archive visibility so every listing and route builder
 * applies the same rule instead of reimplementing status checks per page.
 *
 * - Listings only ever show "published" entries, in dev or prod.
 * - Page generation includes drafts in dev (so authors can preview them)
 *   but excludes drafts in production builds. Archived entries still
 *   build a page (addressable) in both — they're just never listed.
 *
 * These only touch fields shared by every collection (status, date), so
 * they're typed structurally against `{ data: { ... } }` rather than
 * through astro:content's CollectionEntry<C>. Generic inference for C
 * there goes through an indexed-access type (Flatten<DataEntryMap[C]>),
 * which TypeScript can't reliably infer from a concrete argument — it was
 * silently widening to the union of every collection's shape, which
 * `astro check` caught as real type errors at every call site that then
 * accessed a collection-specific field (e.g. entry.data.insightType) on
 * the sorted/filtered result.
 */

interface WithStatus {
  data: { status: "draft" | "published" | "archived" };
}

interface WithDate {
  data: { date: Date };
}

export function isListable<T extends WithStatus>(entry: T): boolean {
  return entry.data.status === "published";
}

export function isBuildable<T extends WithStatus>(entry: T): boolean {
  if (import.meta.env.DEV) return true;
  return entry.data.status !== "draft";
}

export function sortByDateDesc<T extends WithDate>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
