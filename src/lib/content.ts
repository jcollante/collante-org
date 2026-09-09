import type { CollectionEntry, CollectionKey } from "astro:content";

/**
 * Centralizes draft/archive visibility so every listing and route builder
 * applies the same rule instead of reimplementing status checks per page.
 *
 * - Listings only ever show "published" entries, in dev or prod.
 * - Page generation includes drafts in dev (so authors can preview them)
 *   but excludes drafts in production builds. Archived entries still
 *   build a page (addressable) in both — they're just never listed.
 */

export function isListable<C extends CollectionKey>(entry: CollectionEntry<C>): boolean {
  return entry.data.status === "published";
}

export function isBuildable<C extends CollectionKey>(entry: CollectionEntry<C>): boolean {
  if (import.meta.env.DEV) return true;
  return entry.data.status !== "draft";
}

export function sortByDateDesc<C extends CollectionKey>(
  entries: CollectionEntry<C>[],
): CollectionEntry<C>[] {
  return [...entries].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
