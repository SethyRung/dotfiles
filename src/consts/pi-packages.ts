import { join } from "node:path";
import { defaultPiPackages } from "@/config.ts";

export const piPackages: string[] = defaultPiPackages;

export function piPackageDir(home: string, spec: string): string {
  const name = spec.startsWith("npm:") ? spec.slice(4) : spec;
  return join(home, ".pi/agent/npm/node_modules", name);
}
