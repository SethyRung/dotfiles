import { $, Glob } from "bun";
import { existsSync, lstatSync, mkdirSync, renameSync, symlinkSync } from "node:fs";
import { homedir, userInfo } from "node:os";
import { join } from "node:path";
import type { Host } from "./host.ts";
import { backupStamp } from "./time.ts";
import { upstreamInstallFor } from "./upstream-installs.ts";

export const unixHost: Host = {
  commandExists(command) {
    return Bun.which(command) !== null;
  },
  async runUpstreamInstall(tool) {
    const install = upstreamInstallFor(tool);
    if (!install) {
      throw new Error(`unknown Upstream Install: ${tool}`);
    }
    const env = { ...process.env, ...install.env };
    if (install.via === "sh-c") {
      const script = await $`curl -fsSL ${install.url}`.text();
      await $`${install.shell} -c ${script}`.env(env);
      return;
    }
    await $`curl -fsSL ${install.url} | ${install.shell}`.env(env);
  },
  packageManager() {
    if (Bun.which("apt-get") ?? Bun.which("apt")) {
      return "apt";
    }
    if (Bun.which("pacman")) {
      return "pacman";
    }
    if (Bun.which("dnf")) {
      return "dnf";
    }
    if (Bun.which("zypper")) {
      return "zypper";
    }
    return null;
  },
  async installPackages(packages) {
    const pm = unixHost.packageManager();
    const cmd =
      pm === "apt"
        ? ["sudo", "apt-get", "install", "-y", ...packages]
        : pm === "pacman"
          ? ["sudo", "pacman", "-S", "--noconfirm", ...packages]
          : pm === "dnf"
            ? ["sudo", "dnf", "install", "-y", ...packages]
            : pm === "zypper"
              ? ["sudo", "zypper", "install", "-y", ...packages]
              : null;
    if (!cmd) {
      throw new Error("unknown package manager");
    }
    const proc = Bun.spawn(cmd, { stdout: "inherit", stderr: "inherit" });
    if ((await proc.exited) !== 0) {
      throw new Error("Distro package install failed");
    }
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
  async changeLoginShell(shell) {
    const path = Bun.which(shell);
    if (!path) {
      throw new Error(`login shell not found: ${shell}`);
    }
    await $`chsh -s ${path}`;
  },
  async linkDotfiles() {
    const destDir = join(homedir(), ".local/bin");
    mkdirSync(destDir, { recursive: true });
    const dest = join(destDir, "dotfiles");
    if (existsSync(dest)) {
      return;
    }
    symlinkSync(join(import.meta.dir, "..", "dotfiles"), dest);
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
  homeTree() {
    const tree = join(import.meta.dir, "..", "home");
    if (!existsSync(tree)) {
      return [];
    }
    return [...new Glob("**/*").scanSync({ cwd: tree, dot: true })];
  },
  backup(path) {
    const dest = `${path}.${backupStamp()}`;
    renameSync(path, dest);
    return dest;
  },
  async stow(relPaths) {
    if (relPaths.length === 0) {
      return;
    }
    const repoRoot = join(import.meta.dir, "..");
    await $`stow -d ${repoRoot} -t ${homedir()} home`;
  },
  async installPiPackages(packages) {
    for (const pkg of packages) {
      await $`pi install ${pkg}`;
    }
  },
  async installSkills(specs) {
    for (const spec of specs) {
      await $`bunx skills add ${spec} -g -y`;
    }
  },
};
