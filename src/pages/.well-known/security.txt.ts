import { siteConfig } from "../../lib/site";

// RFC 9116 security.txt, generated so the contact stays in sync with siteConfig.
// Expires is recomputed on every build, so any deploy within the year renews it.
export function GET() {
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);

  const body = [
    `Contact: mailto:${siteConfig.email}`,
    `Expires: ${expires.toISOString()}`,
    `Canonical: ${siteConfig.url}/.well-known/security.txt`,
    "Preferred-Languages: en",
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
