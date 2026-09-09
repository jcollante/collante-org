export const siteConfig = {
  name: "Jonatan Collante",
  role: "Data & AI Architect",
  url: "https://collante.ai",
  // TODO: confirm the real LinkedIn profile URL — placeholder, not a guess.
  linkedInUrl: "https://www.linkedin.com/in/TODO-jonatan-collante",
  // TODO: confirm the public contact email to publish.
  email: "hello@collante.ai",
  // TODO: optional — set to a real GitHub URL if it should appear (footer, secondary), or leave undefined to omit.
  githubUrl: undefined as string | undefined,
};

export const primaryNav = [
  { label: "Architecture", href: "/architecture/" },
  { label: "Accelerators", href: "/accelerators/" },
  { label: "Insights", href: "/insights/" },
  { label: "Lab", href: "/lab/" },
  { label: "About", href: "/about/" },
] as const;
