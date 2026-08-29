import { $, Glob } from "bun";
import { existsSync, lstatSync, mkdirSync, renameSync, symlinkSync, unlinkSync } from "node:fs";
import { homedir, userInfo } from "node:os";
import { dirname, join } from "node:path";
import { upstreamInstallFor } from "./consts/upstream-installs.ts";
import type { Host } from "./types/host.ts";
import { backupStamp } from "./utils/time.ts";

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
    } else {
      await $`curl -fsSL ${install.url} | ${install.shell}`.env(env);
    }
    if (install.then) {
      await $`${install.shell} -c ${install.then}`.env(env);
      const nodePath = (
        await $`${install.shell} -c ${'. "$HOME/.nvm/nvm.sh" && command -v node'}`.env(env).text()
      ).trim();
      if (nodePath) {
        process.env.PATH = `${dirname(nodePath)}:${process.env.PATH ?? ""}`;
      }
    }
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
  async reboot() {
    const proc = Bun.spawn(["sudo", "reboot"], { stdout: "inherit", stderr: "inherit" });
    if ((await proc.exited) !== 0) {
      throw new Error("reboot failed");
    }
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
    const tree = join(import.meta.dir, "..", "home");
    const home = homedir();
    for (const rel of relPaths) {
      const dest = join(home, rel);
      mkdirSync(dirname(dest), { recursive: true });
      try {
        lstatSync(dest);
      } catch {
        symlinkSync(join(tree, rel), dest);
      }
    }
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
  async prompt(message) {
    return globalThis.prompt(message) ?? "";
  },
  async readEnvironment() {
    const file = Bun.file("/etc/environment");
    if (!(await file.exists())) {
      return "";
    }
    return await file.text();
  },
  async writeEnvironment(content) {
    const proc = Bun.spawn(["sudo", "tee", "/etc/environment"], {
      stdin: new Blob([content]),
      stdout: "ignore",
      stderr: "inherit",
    });
    if ((await proc.exited) !== 0) {
      throw new Error("failed to write /etc/environment");
    }
  },
  async readFile(path) {
    const file = Bun.file(path);
    if (!(await file.exists())) {
      return null;
    }
    return await file.text();
  },
  async writeFile(path, content) {
    mkdirSync(dirname(path), { recursive: true });
    try {
      if (lstatSync(path).isSymbolicLink()) {
        unlinkSync(path);
      }
    } catch {}
    await Bun.write(path, content);
  },
};
