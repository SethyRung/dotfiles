import { join } from "node:path";
import type { Host } from "./host.ts";
import { ghosttyPackageFor, packagesFor } from "./package-map.ts";
import { piPackages } from "./pi-packages.ts";
import { skillsList } from "./skills-list.ts";

export type RunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

const helpText = `Usage: dotfiles <command>

Commands:
  init    Bootstrap the Workflow
  doctor  Report what is present or missing
  stow    Re-link home/ into $HOME
`;

export async function run(args: string[], host: Host): Promise<RunResult> {
  if (!host.commandExists("bun")) {
    await host.runUpstreamInstall("bun");
  }
  if (args[0] === "init") {
    return await init(host);
  }
  if (args[0] === "doctor") {
    return await doctor(host);
  }
  if (args[0] === "stow") {
    return await stow(host);
  }
  return { exitCode: 0, stdout: helpText, stderr: "" };
}

async function init(host: Host): Promise<RunResult> {
  const pm = host.packageManager();
  if (!pm) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: "Unknown package manager. Bootstrap needs apt, pacman, dnf, or zypper.\n",
    };
  }
  const reRun = workflowLooksPresent(host);
  if (reRun) {
    const cont = (await host.prompt("Workflow already present. Continue? [y/N] "))
      .trim()
      .toLowerCase();
    if (cont !== "y" && cont !== "yes") {
      return { exitCode: 0, stdout: "", stderr: "" };
    }
  }
  try {
    const home = host.homeDir();
    const pkgs = packagesFor(pm).filter((name) => !host.commandExists(name));
    if (pkgs.length > 0) {
      await host.installPackages(pkgs);
    }
    if (!host.fileExists(join(home, ".oh-my-zsh"))) {
      await host.runUpstreamInstall("oh-my-zsh");
    }
    if (!host.commandExists("herdr")) {
      await host.runUpstreamInstall("herdr");
    }
    if (!host.commandExists("pi")) {
      await host.runUpstreamInstall("pi");
      await host.installPiPackages(piPackages);
    }
    if (!host.commandExists("opencode")) {
      await host.runUpstreamInstall("opencode");
    }
    if (!host.fileExists(join(home, ".agents/skills"))) {
      await host.installSkills(skillsList);
    }
    const stowed = await stow(host, { skipGhostty: true, confirmConflicts: reRun });
    if (stowed.exitCode !== 0) {
      return stowed;
    }
    await mirrorOpenCodeMcp(host);
    const apiKeysCsv = (await host.prompt("API Keys (key=value CSV, empty skips): ")).trim();
    if (apiKeysCsv !== "") {
      const confirmed = (await host.prompt("Write API Keys to /etc/environment? [y/N] "))
        .trim()
        .toLowerCase();
      if (confirmed === "y" || confirmed === "yes") {
        await host.writeEnvironment(
          mergeEnvironment(await host.readEnvironment(), parseApiKeyCsv(apiKeysCsv)),
        );
      }
    }
    let stderr = "";
    const wantGhostty =
      !reRun &&
      ["y", "yes"].includes((await host.prompt("Install Ghostty? [y/N] ")).trim().toLowerCase());
    if (wantGhostty) {
      const ghostty = ghosttyPackageFor(pm);
      if (ghostty) {
        try {
          await host.installPackages([ghostty]);
          await stow(host, { onlyGhostty: true });
        } catch {
          stderr = "Ghostty install failed.\n";
        }
      } else {
        stderr = `Ghostty is not in the Package Map for ${pm}.\n`;
      }
    }
    const shell = host.loginShell();
    if (shell !== "zsh" && !shell?.endsWith("/zsh")) {
      await host.changeLoginShell("zsh");
    }
    if (!host.fileExists(join(home, ".local/bin/dotfiles"))) {
      await host.linkDotfiles();
    }
    return { exitCode: 0, stdout: "", stderr };
  } catch (error) {
    const message = error instanceof Error ? error.message : "required step failed";
    return { exitCode: 1, stdout: "", stderr: `${message}\n` };
  }
}

async function doctor(host: Host): Promise<RunResult> {
  const home = host.homeDir();
  const lines: string[] = [];
  let failed = false;

  const check = (label: string, ok: boolean) => {
    if (ok) {
      lines.push(`${label}: ok`);
    } else {
      lines.push(`${label}: missing`);
      failed = true;
    }
  };

  check("zsh", host.commandExists("zsh"));
  check("Oh My Zsh", host.fileExists(join(home, ".oh-my-zsh")));
  check("git", host.commandExists("git"));
  check("stow", host.commandExists("stow"));
  check("bun", host.commandExists("bun"));
  check("pi", host.commandExists("pi"));
  check("herdr", host.commandExists("herdr"));
  check("OpenCode", host.commandExists("opencode"));
  check("Skills", host.fileExists(join(home, ".agents/skills")));
  check("XDG MCP", host.fileExists(join(home, ".config/mcp/mcp.json")));
  const shell = host.loginShell();
  check("login shell", shell === "zsh" || (shell?.endsWith("/zsh") ?? false));
  check("dotfiles PATH symlink", host.fileExists(join(home, ".local/bin/dotfiles")));
  if (!host.commandExists("ghostty")) {
    lines.push("Ghostty: missing (optional)");
  }
  for (const name of await host.environmentKeyNames()) {
    lines.push(`${name}: present`);
  }
  for (const link of host.brokenStowLinks()) {
    lines.push(`broken Stow: ${link}`);
    failed = true;
  }

  return {
    exitCode: failed ? 1 : 0,
    stdout: `${lines.join("\n")}\n`,
    stderr: "",
  };
}

function workflowLooksPresent(host: Host): boolean {
  const home = host.homeDir();
  const shell = host.loginShell();
  return (
    host.commandExists("zsh") &&
    host.fileExists(join(home, ".oh-my-zsh")) &&
    host.commandExists("git") &&
    host.commandExists("stow") &&
    host.commandExists("bun") &&
    host.commandExists("pi") &&
    host.commandExists("herdr") &&
    host.commandExists("opencode") &&
    host.fileExists(join(home, ".agents/skills")) &&
    host.fileExists(join(home, ".config/mcp/mcp.json")) &&
    (shell === "zsh" || (shell?.endsWith("/zsh") ?? false)) &&
    host.fileExists(join(home, ".local/bin/dotfiles"))
  );
}

function isStowJunk(rel: string): boolean {
  const parts = rel.split("/");
  const base = parts.at(-1) ?? rel;
  return (
    parts.includes("logs") ||
    parts.includes("sockets") ||
    parts.includes("sessions") ||
    parts.includes("node_modules") ||
    parts.includes("cache") ||
    rel.startsWith(".config/opencode/skills/") ||
    rel.startsWith(".pi/agent/extensions/") ||
    rel.endsWith(".log") ||
    rel.endsWith(".sock") ||
    rel.endsWith(".db") ||
    rel.endsWith(".db-shm") ||
    rel.endsWith(".db-wal") ||
    base === "auth.json" ||
    base.includes("cache") ||
    base.startsWith("models")
  );
}

function isGhosttyConfig(rel: string): boolean {
  return rel.startsWith(".config/ghostty/");
}

async function stow(
  host: Host,
  options: { skipGhostty?: boolean; onlyGhostty?: boolean; confirmConflicts?: boolean } = {},
): Promise<RunResult> {
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
      const overwrite = ["y", "yes"].includes(
        (await host.prompt("Overwrite existing files with Stow? [y/N] ")).trim().toLowerCase(),
      );
      if (!overwrite) {
        rels = rels.filter((rel) => !conflicts.includes(rel));
      }
    }
  }
  for (const rel of rels) {
    const dest = join(home, rel);
    if (host.fileExists(dest)) {
      host.backup(dest);
    }
  }
  await host.stow(rels);
  return { exitCode: 0, stdout: "", stderr: "" };
}

async function mirrorOpenCodeMcp(host: Host): Promise<void> {
  const home = host.homeDir();
  const xdgText = await host.readFile(join(home, ".config/mcp/mcp.json"));
  if (xdgText == null) {
    return;
  }
  const xdg = JSON.parse(xdgText) as {
    mcpServers?: Record<string, { command?: string; args?: string[] }>;
  };
  const ocPath = join(home, ".config/opencode/opencode.json");
  const existingText = await host.readFile(ocPath);
  const existing = existingText ? JSON.parse(existingText) : {};
  const mcp: Record<string, { type: string; url?: string; command?: string[] }> = {};
  for (const [name, spec] of Object.entries(xdg.mcpServers ?? {})) {
    const args = spec.args ?? [];
    const url = args.find((arg) => arg.startsWith("https://") || arg.startsWith("http://"));
    if (url) {
      mcp[name] = { type: "remote", url };
    } else {
      mcp[name] = { type: "local", command: [spec.command, ...args].filter((p) => p != null) };
    }
  }
  existing.mcp = mcp;
  await host.writeFile(ocPath, `${JSON.stringify(existing, null, 2)}\n`);
}

function parseApiKeyCsv(csv: string): Record<string, string> {
  const keys: Record<string, string> = {};
  for (const part of csv.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    keys[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1);
  }
  return keys;
}

function mergeEnvironment(existing: string, keys: Record<string, string>): string {
  const pending = { ...keys };
  const source =
    existing === ""
      ? []
      : existing.endsWith("\n")
        ? existing.slice(0, -1).split("\n")
        : existing.split("\n");
  const out: string[] = [];
  for (const line of source) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const name = trimmed.slice(0, eq);
        if (Object.hasOwn(pending, name)) {
          out.push(`${name}=${pending[name]}`);
          delete pending[name];
          continue;
        }
      }
    }
    out.push(line);
  }
  for (const [name, value] of Object.entries(pending)) {
    out.push(`${name}=${value}`);
  }
  return `${out.join("\n")}\n`;
}
