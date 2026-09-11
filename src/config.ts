import rawConfig from "../dotfiles.json";
import type { PackageManager } from "@/types/host.ts";

export type DotfilesToolsConfig = {
  ghostty?: boolean;
  zed?: boolean;
  skills?: boolean;
  piPackages?: boolean;
  omzPlugins?: boolean;
};

export type McpServer = {
  url?: string;
  command?: string;
  args?: string[];
};

export type DotfilesConfig = {
  $schema?: string;
  tools?: DotfilesToolsConfig;
  skills: string[];
  piPackages: string[];
  omzPlugins: string[];
  packages: Record<PackageManager, string[]>;
  mcp: Record<string, McpServer>;
};

export const defaultConfig: DotfilesConfig = rawConfig as DotfilesConfig;

export const defaultSkills = defaultConfig.skills;
export const defaultPiPackages = defaultConfig.piPackages;
export const defaultOmzPlugins = defaultConfig.omzPlugins;
export const defaultPackages = defaultConfig.packages;
export const defaultMcp = defaultConfig.mcp;

export function defaultPackagesFor(pm: PackageManager): string[] {
  return defaultConfig.packages[pm] ?? [];
}
