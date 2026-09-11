import { join } from "node:path";
import {
  defaultApiKeys,
  defaultConfig,
  defaultMcp,
  defaultOmzPlugins,
  defaultPackagesFor,
  defaultPiPackages,
  defaultSkills,
  type DotfilesToolsConfig,
  type McpServer,
} from "@/config.ts";
import type { Host, PackageManager } from "@/types/host.ts";

export type DotfilesPresetInput = {
  tools?: DotfilesToolsConfig;
  skills?: string[];
  piPackages?: string[];
  pi_packages?: string[];
  omzPlugins?: string[];
  omz_plugins?: string[];
  distroPackages?: string[] | Partial<Record<PackageManager, string[]>>;
  distro_packages?: string[] | Partial<Record<PackageManager, string[]>>;
  packages?: string[] | Partial<Record<PackageManager, string[]>>;
  mcp?: Record<string, McpServer>;
  apiKeys?: string[];
};

export type DotfilesPreset = {
  tools: DotfilesToolsConfig;
  skills: string[];
  piPackages: string[];
  omzPlugins: string[];
  mcp: Record<string, McpServer>;
  apiKeys: string[];
  distroPackagesFor(pm: PackageManager): string[];
  isToolEnabled(name: keyof DotfilesToolsConfig, defaultVal?: boolean): boolean;
};

export function parsePreset(content: string): DotfilesPreset {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse dotfiles.json: ${msg}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid dotfiles.json: root must be an object");
  }
  const raw = parsed as DotfilesPresetInput;
  const skills = Array.isArray(raw.skills) ? raw.skills : [...defaultSkills];
  const piPackages = Array.isArray(raw.piPackages)
    ? raw.piPackages
    : Array.isArray(raw.pi_packages)
      ? raw.pi_packages
      : [...defaultPiPackages];
  const omzPlugins = Array.isArray(raw.omzPlugins)
    ? raw.omzPlugins
    : Array.isArray(raw.omz_plugins)
      ? raw.omz_plugins
      : [...defaultOmzPlugins];

  const mcp =
    raw.mcp && typeof raw.mcp === "object" && !Array.isArray(raw.mcp) ? raw.mcp : { ...defaultMcp };
  const apiKeys = Array.isArray(raw.apiKeys) ? raw.apiKeys : [...defaultApiKeys];

  const packagesRaw = raw.packages ?? raw.distroPackages ?? raw.distro_packages;
  const toolsRaw = raw.tools ?? {};
  const tools: DotfilesToolsConfig = {
    ghostty: toolsRaw.ghostty,
    zed: toolsRaw.zed,
    skills: toolsRaw.skills,
    piPackages: toolsRaw.piPackages ?? (toolsRaw as { pi_packages?: boolean }).pi_packages,
    omzPlugins: toolsRaw.omzPlugins ?? (toolsRaw as { omz_plugins?: boolean }).omz_plugins,
  };

  return {
    tools,
    skills,
    piPackages,
    omzPlugins,
    mcp,
    apiKeys,
    distroPackagesFor(pm: PackageManager): string[] {
      if (Array.isArray(packagesRaw)) {
        return packagesRaw;
      }
      if (packagesRaw && typeof packagesRaw === "object" && pm in packagesRaw) {
        const pkgs = packagesRaw[pm];
        if (Array.isArray(pkgs)) {
          return pkgs;
        }
      }
      return defaultPackagesFor(pm);
    },
    isToolEnabled(name: keyof DotfilesToolsConfig, defaultVal = true): boolean {
      const val = tools[name];
      return val !== undefined ? val : defaultVal;
    },
  };
}

export function defaultPreset(): DotfilesPreset {
  const tools: DotfilesToolsConfig = {
    ghostty: defaultConfig.tools?.ghostty,
    zed: defaultConfig.tools?.zed,
    skills: defaultConfig.tools?.skills,
    piPackages: defaultConfig.tools?.piPackages,
    omzPlugins: defaultConfig.tools?.omzPlugins,
  };
  return {
    tools,
    skills: [...defaultSkills],
    piPackages: [...defaultPiPackages],
    omzPlugins: [...defaultOmzPlugins],
    mcp: { ...defaultMcp },
    apiKeys: [...defaultApiKeys],
    distroPackagesFor: defaultPackagesFor,
    isToolEnabled(name: keyof DotfilesToolsConfig, defaultVal = true): boolean {
      const val = tools[name];
      return val !== undefined ? val : defaultVal;
    },
  };
}

export async function loadPreset(host: Host): Promise<DotfilesPreset> {
  const path = join(host.repoDir(), "dotfiles.json");
  const content = await host.readFile(path);
  if (content === null || content.trim() === "") {
    return defaultPreset();
  }
  return parsePreset(content);
}
