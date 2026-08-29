import { join } from "node:path";
import { helpText } from "./consts/help.ts";
import { ghosttyPackageFor, packagesFor } from "./consts/package-map.ts";
import { piPackages } from "./consts/pi-packages.ts";
import { skillsList } from "./consts/skills-list.ts";
import type { Host } from "./types/host.ts";
import type { RunResult, StowOptions } from "./types/result.ts";
import { mergeEnvironment, parseApiKeyCsv } from "./utils/environment.ts";
import { mirrorOpenCodeMcp } from "./utils/mcp.ts";
import { isYes, isZsh } from "./utils/prompt.ts";
import { isGhosttyConfig, isStowJunk } from "./utils/stow.ts";

export type { RunResult };

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
    const cont = await host.prompt("Workflow already present. Continue? [y/N] ");
    if (!isYes(cont)) {
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
    if (!host.commandExists("npm")) {
      await host.runUpstreamInstall("nvm");
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
      const confirmed = await host.prompt("Write API Keys to /etc/environment? [y/N] ");
      if (isYes(confirmed)) {
        await host.writeEnvironment(
          mergeEnvironment(await host.readEnvironment(), parseApiKeyCsv(apiKeysCsv)),
        );
      }
    }
    let stderr = "";
    const wantGhostty = !reRun && isYes(await host.prompt("Install Ghostty? [y/N] "));
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
    let shellChanged = false;
    if (!isZsh(host.loginShell())) {
      await host.changeLoginShell("zsh");
      shellChanged = true;
    }
    if (!host.fileExists(join(home, ".local/bin/dotfiles"))) {
      await host.linkDotfiles();
    }
    if (shellChanged) {
      const message =
        "Login shell is now zsh. Run `zsh` or `reboot` to fully apply the change.\n" +
        "Reboot to apply it? [y/N] ";
      const reboot = isYes(await host.prompt(message));
      if (reboot) {
        try {
          await host.reboot();
          return { exitCode: 0, stdout: "Rebooting; new sessions will start in zsh.\n", stderr };
        } catch {
          return {
            exitCode: 0,
            stdout: "",
            stderr: `${stderr}Reboot failed. Run 'sudo reboot' when ready.\n`,
          };
        }
      }
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
  check("npm", host.commandExists("npm"));
  check("bun", host.commandExists("bun"));
  check("pi", host.commandExists("pi"));
  check("herdr", host.commandExists("herdr"));
  check("OpenCode", host.commandExists("opencode"));
  check("Skills", host.fileExists(join(home, ".agents/skills")));
  check("XDG MCP", host.fileExists(join(home, ".config/mcp/mcp.json")));
  check("login shell", isZsh(host.loginShell()));
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
  return (
    host.commandExists("zsh") &&
    host.fileExists(join(home, ".oh-my-zsh")) &&
    host.commandExists("git") &&
    host.commandExists("stow") &&
    host.commandExists("npm") &&
    host.commandExists("bun") &&
    host.commandExists("pi") &&
    host.commandExists("herdr") &&
    host.commandExists("opencode") &&
    host.fileExists(join(home, ".agents/skills")) &&
    host.fileExists(join(home, ".config/mcp/mcp.json")) &&
    isZsh(host.loginShell()) &&
    host.fileExists(join(home, ".local/bin/dotfiles"))
  );
}

async function stow(host: Host, options: StowOptions = {}): Promise<RunResult> {
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
    if (host.fileExists(dest)) {
      host.backup(dest);
    }
  }
  await host.stow(rels);
  return { exitCode: 0, stdout: "", stderr: "" };
}
