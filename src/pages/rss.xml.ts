import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { isListable } from "../lib/content";
import { siteConfig } from "../lib/site";

const basePathFor: Record<string, string> = {
  architecture: "/architecture/",
  accelerators: "/accelerators/",
  decisions: "/decisions/",
  insights: "/insights/",
  lab: "/lab/",
};

export async function GET(context: APIContext) {
  const collections = ["architecture", "accelerators", "decisions", "insights", "lab"] as const;
  const items = [];

  for (const name of collections) {
    const entries = (await getCollection(name)).filter(isListable);
    for (const entry of entries) {
      items.push({
        title: entry.data.title,
        description: entry.data.description,
        pubDate: entry.data.date,
        link: `${basePathFor[name]}${entry.id}/`,
      });
    }
  }

  items.sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: `${siteConfig.name} — ${siteConfig.role}`,
    description: "Reference architectures, decisions, and perspectives on enterprise Data & AI platforms.",
    site: context.site ?? siteConfig.url,
    items,
  });
}
