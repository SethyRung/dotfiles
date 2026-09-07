import { join } from "node:path";
import { defaultSkills } from "@/config.ts";

export const skillsList: string[] = defaultSkills;

export function skillDir(home: string, spec: string): string {
  const name = spec.split("@")[1] ?? spec;
  return join(home, ".agents/skills", name);
}
