import { defaultPackagesFor } from "@/config.ts";
import type { PackageManager } from "@/types/host.ts";

export const requiredDistroTools = ["zsh", "git", "stow"] as const;

export function packagesFor(pm: PackageManager): string[] {
  return defaultPackagesFor(pm);
}

export const ghosttyPackageMap: Partial<Record<PackageManager, string>> = {
  apt: "ghostty",
  pacman: "ghostty",
  dnf: "ghostty",
  zypper: "ghostty",
};

export function ghosttyPackageFor(pm: PackageManager): string | undefined {
  return ghosttyPackageMap[pm];
}
