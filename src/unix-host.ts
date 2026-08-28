import { $, Glob } from "bun";
import { existsSync, lstatSync } from "node:fs";
import { homedir, userInfo } from "node:os";
import { join } from "node:path";
import type { Host } from "./host.ts";

export const unixHost: Host = {
  commandExists(command) {
    return Bun.which(command) !== null;
  },
  async runUpstreamInstall(tool) {
    if (tool !== "bun") {
      throw new Error(`unknown Upstream Install: ${tool}`);
    }
    await $`curl -fsSL https://bun.com/install | bash`;
  },
  homeDir() {
    return homedir();
  },
  fileExists(path) {
    return existsSync(path);
  },
  loginShell() {
    try {
      return userInfo().shell ?? null;
    } catch {
      return null;
    }
  },
  async environmentKeyNames() {
    const file = Bun.file("/etc/environment");
    if (!(await file.exists())) {
      return [];
    }
    const text = await file.text();
    const names: string[] = [];
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const eq = trimmed.indexOf("=");
      if (eq <= 0) {
        continue;
      }
      names.push(trimmed.slice(0, eq));
    }
    return names;
  },
  brokenStowLinks() {
    const tree = join(import.meta.dir, "..", "home");
    if (!existsSync(tree)) {
      return [];
    }
    const broken: string[] = [];
    const glob = new Glob("**/*");
    for (const rel of glob.scanSync({ cwd: tree, dot: true })) {
      const dest = join(homedir(), rel);
      try {
        if (lstatSync(dest).isSymbolicLink() && !existsSync(dest)) {
          broken.push(dest);
        }
      } catch {
        continue;
      }
    }
    return broken;
  },
};
