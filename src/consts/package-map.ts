import type { PackageManager } from "@/types/host.ts";

export const requiredDistroTools = ["zsh", "git", "stow"] as const;

export const packageMap: Record<
  (typeof requiredDistroTools)[number],
  Record<PackageManager, string>
> = {
  zsh: { apt: "zsh", pacman: "zsh", dnf: "zsh", zypper: "zsh" },
  git: { apt: "git", pacman: "git", dnf: "git", zypper: "git" },
  stow: { apt: "stow", pacman: "stow", dnf: "stow", zypper: "stow" },
};

export function packagesFor(pm: PackageManager): string[] {
  return requiredDistroTools.map((tool) => packageMap[tool][pm]);
}

export const ghosttyPackageMap: Partial<Record<PackageManager, string>> = {
  apt: "ghostty",
  pacman: "ghostty",
  dnf: "ghostty",
};

export function ghosttyPackageFor(pm: PackageManager): string | undefined {
  return ghosttyPackageMap[pm];
}
