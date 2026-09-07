import rawConfig from "../dotfiles.json";
import type { PackageManager } from "@/types/host.ts";

export type DotfilesConfig = {
  $schema?: string;
  skills: string[];
  piPackages: string[];
  omzPlugins: string[];
  packages: Record<PackageManager, string[]>;
};

export const defaultConfig: DotfilesConfig = rawConfig as DotfilesConfig;

export const defaultSkills = defaultConfig.skills;
export const defaultPiPackages = defaultConfig.piPackages;
export const defaultOmzPlugins = defaultConfig.omzPlugins;
export const defaultPackages = defaultConfig.packages;

export function defaultPackagesFor(pm: PackageManager): string[] {
  return defaultConfig.packages[pm] ?? [];
}
