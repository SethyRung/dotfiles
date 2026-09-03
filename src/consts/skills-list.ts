import { join } from "node:path";

export const skillsList = [
  "vercel-labs/skills@find-skills",
  "mattpocock/skills@grill-me",
  "mattpocock/skills@grill-with-docs",
  "mattpocock/skills@to-spec",
  "mattpocock/skills@to-tickets",
  "firecrawl/anydoc@convert-documents-to-markdown",
  "mattpocock/skills@code-review",
  "mattpocock/skills@implement",
  "mattpocock/skills@improve-codebase-architecture",
  "mattpocock/skills@resolving-merge-conflicts",
  "mattpocock/skills@tdd",
  "mattpocock/skills@teach",
  "mattpocock/skills@prototype",
  "mattpocock/skills@wait-what",
];

export function skillDir(home: string, spec: string): string {
  const name = spec.split("@")[1] ?? spec;
  return join(home, ".agents/skills", name);
}
