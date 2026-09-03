import { join } from "node:path";
import type { Host } from "@/types/host.ts";
import type { RunResult, StowOptions } from "@/types/result.ts";
import { isYes } from "@/utils/prompt.ts";
import { isGhosttyConfig, isStowJunk } from "@/utils/stow.ts";

export async function stow(host: Host, options: StowOptions = {}): Promise<RunResult> {
  let rels = host.homeTree().filter((rel) => {
    if (isStowJunk(rel)) {
      return false;
    }
    if (options.onlyGhostty) {
      return isGhosttyConfig(rel);
    }
    if (options.skipGhostty) {
      return !isGhosttyConfig(rel);
    }
    return true;
  });
  const home = host.homeDir();
  if (options.confirmConflicts) {
    const conflicts = rels.filter((rel) => host.fileExists(join(home, rel)));
    if (conflicts.length > 0) {
      const overwrite = isYes(await host.prompt("Overwrite existing files with Stow? [y/N] "));
      if (!overwrite) {
        rels = rels.filter((rel) => !conflicts.includes(rel));
      }
    }
  }
  for (const rel of rels) {
    const dest = join(home, rel);
    if (host.fileExists(dest) && !host.linksIntoRepo(dest) && !host.isSymlink(dest)) {
      host.backup(dest);
    }
  }
  await host.stow(rels);
  return { exitCode: 0, stdout: "", stderr: "" };
}

export async function stowCommand(host: Host): Promise<RunResult> {
  await host.linkDotfiles();
  return await stow(host);
}
