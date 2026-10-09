import { siteConfig } from "./site";

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.name,
    jobTitle: siteConfig.role,
    url: siteConfig.url,
    email: siteConfig.email,
    sameAs: [
      siteConfig.linkedInUrl,
      ...(siteConfig.githubUrl ? [siteConfig.githubUrl] : []),
      siteConfig.databricksCredentialsUrl,
    ],
  };
}
