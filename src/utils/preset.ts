import { join } from "node:path";
import {
  defaultOmzPlugins,
  defaultPackagesFor,
  defaultPiPackages,
  defaultSkills,
} from "@/config.ts";
import type { Host, PackageManager } from "@/types/host.ts";

export type DotfilesPresetInput = {
  skills?: string[];
  piPackages?: string[];
  pi_packages?: string[];
  omzPlugins?: string[];
  omz_plugins?: string[];
  distroPackages?: string[] | Partial<Record<PackageManager, string[]>>;
  distro_packages?: string[] | Partial<Record<PackageManager, string[]>>;
  packages?: string[] | Partial<Record<PackageManager, string[]>>;
};

export type DotfilesPreset = {
  skills: string[];
  piPackages: string[];
  omzPlugins: string[];
  distroPackagesFor(pm: PackageManager): string[];
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

  const packagesRaw = raw.packages ?? raw.distroPackages ?? raw.distro_packages;

  return {
    skills,
    piPackages,
    omzPlugins,
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
  };
}

export function defaultPreset(): DotfilesPreset {
  return {
    skills: [...defaultSkills],
    piPackages: [...defaultPiPackages],
    omzPlugins: [...defaultOmzPlugins],
    distroPackagesFor: defaultPackagesFor,
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
