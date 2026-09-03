import Bun from "bun";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  renameSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { homedir, userInfo } from "node:os";
import { dirname, join } from "node:path";
import { upstreamInstallFor } from "@/consts/upstream-installs.ts";
import type { Host } from "@/types/host.ts";
import type { ProgressFrame } from "@/types/progress.ts";
import { mergeEnvironment } from "@/utils/environment.ts";
import { renderBanner, renderPanel, spinnerFrames } from "@/utils/panel.ts";
import { isYes } from "@/utils/prompt.ts";
import { isGhosttyConfig, isStowJunk } from "@/utils/stow.ts";
import { backupStamp, isBackupStamp } from "@/utils/time.ts";

let progressStartedAt = 0;
let progressLines = 0;
let progressFresh = true;
let spinnerPhase = 0;
let spinnerTimer: ReturnType<typeof setInterval> | null = null;
let lastFrame: ProgressFrame | null = null;
const printedSteps = new Set<number>();

function drawProgress(frame: ProgressFrame) {
  const lines = renderPanel(
    frame,
    spinnerPhase,
    Math.floor((Date.now() - progressStartedAt) / 1000),
  );
  const body = `${lines.map((line) => `${line}\x1b[K`).join("\n")}\n`;
  if (progressLines === 0 || progressFresh) {
    process.stdout.write("\x1b[2J\x1b[H");
    process.stdout.write(renderBanner(frame.title));
    process.stdout.write(body);
    progressLines = lines.length;
    progressFresh = false;
    return;
  }
  process.stdout.write(`\x1b[${progressLines}A\r`);
  process.stdout.write(body);
  progressLines = lines.length;
}

function markNoisy() {
  progressFresh = true;
}

export const unixHost: Host = {
  commandExists(command) {
    if (Bun.which(command) !== null) {
      return true;
    }
    const home = homedir();
    if (existsSync(join(home, ".local/bin", command))) {
      return true;
    }
    const mise = join(home, ".local/share/mise");
    if (existsSync(join(mise, "shims", command))) {
      return true;
    }
    const installs = join(mise, "installs");
    if (existsSync(installs)) {
      const found = [...new Bun.Glob(`*/*/bin/${command}`).scanSync({ cwd: installs })];
      if (found.length > 0) {
        return true;
      }
    }
    return false;
  },
  async runUpstreamInstall(tool) {
    const install = upstreamInstallFor(tool);
    if (!install) {
      throw new Error(`unknown Upstream Install: ${tool}`);
    }
    if (install.via === "git-clone") {
      if (!install.dest) {
        throw new Error(`git-clone Upstream Install needs a dest: ${tool}`);
      }
      await Bun.$`git clone ${install.url} ${join(homedir(), install.dest)}`;
      return;
    }
    const env = { ...process.env, ...install.env };
    if (install.via === "sh-c") {
      const script = await Bun.$`curl -fsSL ${install.url}`.text();
      await Bun.$`${install.shell} -c ${script}`.env(env);
    } else {
      await Bun.$`curl -fsSL ${install.url} | ${install.shell}`.env(env);
    }
  },
  async installMiseTools() {
    const mise = Bun.which("mise") ?? join(homedir(), ".local/bin/mise");
    await Bun.$`${mise} install`;
    process.env.PATH = `${join(homedir(), ".local/share/mise/shims")}:${process.env.PATH ?? ""}`;
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
    markNoisy();
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
    markNoisy();
    const path = Bun.which(shell);
    if (!path) {
      throw new Error(`login shell not found: ${shell}`);
    }
    await Bun.$`chsh -s ${path}`;
  },
  async reboot() {
    markNoisy();
    const proc = Bun.spawn(["sudo", "reboot"], { stdout: "inherit", stderr: "inherit" });
    if ((await proc.exited) !== 0) {
      throw new Error("reboot failed");
    }
  },
  async pullRepo() {
    const root = join(import.meta.dir, "..");
    const output = await Bun.$`git -C ${root} pull --ff-only`.text();
    return output.trim();
  },
  async linkDotfiles() {
    const destDir = join(homedir(), ".local/bin");
    mkdirSync(destDir, { recursive: true });
    const dest = join(destDir, "dotfiles");
    try {
      lstatSync(dest);
      unlinkSync(dest);
    } catch {}
    symlinkSync(join(import.meta.dir, "..", "dotfiles"), dest);
  },
  async listApiKeyNames() {
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
    const glob = new Bun.Glob("**/*");
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
  stowBackups() {
    const home = homedir();
    const found: string[] = [];
    for (const rel of unixHost.homeTree()) {
      const dir = join(home, dirname(rel));
      const base = rel.split("/").at(-1) ?? rel;
      let entries: string[];
      try {
        entries = readdirSync(dir);
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (entry.startsWith(`${base}.`) && isBackupStamp(entry.slice(base.length + 1))) {
          found.push(join(dir, entry));
        }
      }
    }
    return found;
  },
  homeTree() {
    const tree = join(import.meta.dir, "..", "home");
    if (!existsSync(tree)) {
      return [];
    }
    return [...new Bun.Glob("**/*").scanSync({ cwd: tree, dot: true })];
  },
  removeFile(path) {
    unlinkSync(path);
  },
  async stowTree(options = {}) {
    const tree = join(import.meta.dir, "..", "home");
    const home = homedir();
    let rels = unixHost.homeTree().filter((rel) => {
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
    if (options.confirmConflicts) {
      const conflicts = rels.filter((rel) => existsSync(join(home, rel)));
      if (conflicts.length > 0) {
        const overwrite = isYes(
          await unixHost.prompt("Overwrite existing files with Stow? [y/N] "),
        );
        if (!overwrite) {
          rels = rels.filter((rel) => !conflicts.includes(rel));
        }
      }
    }
    for (const rel of rels) {
      const dest = join(home, rel);
      const src = join(tree, rel);
      mkdirSync(dirname(dest), { recursive: true });
      try {
        const stat = lstatSync(dest);
        if (stat.isSymbolicLink()) {
          try {
            const target = readlinkSync(dest);
            if (target === src || target.startsWith(`${tree}/`)) {
              continue;
            }
          } catch {}
          unlinkSync(dest);
        } else {
          renameSync(dest, `${dest}.${backupStamp()}`);
        }
      } catch {
        // dest does not exist
      }
      symlinkSync(src, dest);
    }
  },
  async installPiPackages(packages) {
    for (const pkg of packages) {
      await Bun.$`pi install ${pkg}`;
    }
  },
  async installSkills(specs) {
    for (const spec of specs) {
      const at = spec.lastIndexOf("@");
      if (at <= 0 || at === spec.length - 1) {
        throw new Error(`invalid skill spec: ${spec}`);
      }
      const repo = spec.slice(0, at);
      const skill = spec.slice(at + 1);
      const url = repo.startsWith("https://") ? repo : `https://github.com/${repo}`;
      await Bun.$`npx skills add ${url} --skill ${skill} --global --agent universal -y`;
    }
  },
  async prompt(message) {
    markNoisy();
    return globalThis.prompt(message) ?? "";
  },
  progress(frame) {
    lastFrame = { title: frame.title, steps: frame.steps.map((step) => ({ ...step })) };
    if (progressStartedAt === 0) {
      progressStartedAt = Date.now();
    }
    if (!process.stdout.isTTY) {
      lastFrame.steps.forEach((step, i) => {
        const terminal = step.state !== "pending" && step.state !== "running";
        if (terminal && !printedSteps.has(i)) {
          printedSteps.add(i);
          process.stdout.write(`  ${step.label}: ${step.detail}\n`);
        }
      });
      return;
    }
    drawProgress(lastFrame);
    const anyRunning = lastFrame.steps.some((step) => step.state === "running");
    if (anyRunning && spinnerTimer === null) {
      spinnerTimer = setInterval(() => {
        spinnerPhase = (spinnerPhase + 1) % spinnerFrames();
        if (lastFrame && progressLines > 0 && !progressFresh) {
          drawProgress(lastFrame);
        }
      }, 120);
    } else if (!anyRunning && spinnerTimer !== null) {
      clearInterval(spinnerTimer);
      spinnerTimer = null;
    }
  },
  async mergeApiKeys(keys) {
    markNoisy();
    const file = Bun.file("/etc/environment");
    const existing = (await file.exists()) ? await file.text() : "";
    const content = mergeEnvironment(existing, keys);
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
