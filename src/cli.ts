import { join } from "node:path";
import { helpText } from "@/consts/help.ts";
import { omzPlugins } from "@/consts/omz-plugins.ts";
import { ghosttyPackageFor, packagesFor } from "@/consts/package-map.ts";
import { piPackages } from "@/consts/pi-packages.ts";
import { skillsList } from "@/consts/skills-list.ts";
import { requiredWorkflowTools, workflowTools } from "@/consts/workflow-tools.ts";
import type { WorkflowTool } from "@/consts/workflow-tools.ts";
import type { Host } from "@/types/host.ts";
import type { ProgressState, ProgressStep } from "@/types/progress.ts";
import type { RunResult, StowOptions } from "@/types/result.ts";
import { mergeEnvironment, parseApiKeyCsv } from "@/utils/environment.ts";
import { mirrorOpenCodeMcp } from "@/utils/mcp.ts";
import { isYes, isZsh } from "@/utils/prompt.ts";
import { isGhosttyConfig, isStowJunk } from "@/utils/stow.ts";

export type { RunResult };

export async function run(args: string[], host: Host): Promise<RunResult> {
  if (!host.commandExists(workflowTools.bun.command)) {
    await host.runUpstreamInstall(workflowTools.bun.upstream);
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
  if (args[0] === "clean") {
    return await clean(host);
  }
  if (args[0] === "update") {
    return await update(host);
  }
  return { exitCode: 0, stdout: helpText, stderr: "" };
}

const STEPS = {
  DISTRO: 0,
  OMZ: 1,
  OMZ_PLUGINS: 2,
  NVM: 3,
  HERDR: 4,
  PI: 5,
  OPENCODE: 6,
  ZED: 7,
  SKILLS: 8,
  STOW: 9,
  MCP: 10,
  KEYS: 11,
  GHOSTTY: 12,
  SHELL: 13,
  CLI: 14,
} as const;

function initialSteps(): ProgressStep[] {
  const pending = (label: string, detail: string): ProgressStep => ({
    label,
    detail,
    state: "pending",
  });
  return [
    pending("Distro packages", "zsh, git, stow"),
    pending("Oh My Zsh", "latest"),
    pending("OMZ plugins", "autosuggestions, syntax-highlighting"),
    pending("nvm + Node LTS", "node LTS"),
    pending(workflowTools.herdr.label, "latest"),
    pending("pi + packages", "latest"),
    pending(workflowTools.opencode.label, "latest"),
    pending(workflowTools.zed.label, "latest"),
    pending("Skills", `${skillsList.length} skills`),
    pending("Stow", "home/ tree"),
    pending("OpenCode MCP", "mcp key"),
    pending("API Keys", "will prompt"),
    pending(workflowTools.ghostty.label, "will prompt"),
    pending("login shell", "zsh"),
    pending("dotfiles CLI", "~/.local/bin"),
  ];
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
    const steps = initialSteps();
    const update = (i: number, state: ProgressState, detail: string) => {
      steps[i] = { ...steps[i], state, detail };
      host.progress({ title: `Distro: ${pm}`, steps: steps.map((step) => ({ ...step })) });
    };
    host.progress({ title: `Distro: ${pm}`, steps: steps.map((step) => ({ ...step })) });
    const pkgs = packagesFor(pm).filter((name) => !host.commandExists(name));
    if (pkgs.length > 0) {
      update(STEPS.DISTRO, "running", pkgs.join(", "));
      await host.installPackages(pkgs);
      update(STEPS.DISTRO, "done", pkgs.join(", "));
    } else {
      update(STEPS.DISTRO, "skipped", "present");
    }
    if (!host.fileExists(join(home, ".oh-my-zsh"))) {
      update(STEPS.OMZ, "running", "latest");
      await host.runUpstreamInstall("oh-my-zsh");
      update(STEPS.OMZ, "done", "latest");
    } else {
      update(STEPS.OMZ, "skipped", "present");
    }
    const missingPlugins = omzPlugins.filter(
      (plugin) => !host.fileExists(join(home, `.oh-my-zsh/custom/plugins/${plugin}`)),
    );
    if (missingPlugins.length > 0) {
      update(STEPS.OMZ_PLUGINS, "running", missingPlugins.join(", "));
      for (const plugin of missingPlugins) {
        await host.runUpstreamInstall(plugin);
      }
      update(STEPS.OMZ_PLUGINS, "done", `${omzPlugins.length} plugins`);
    } else {
      update(STEPS.OMZ_PLUGINS, "skipped", "present");
    }
    if (!host.commandExists(workflowTools.npm.command)) {
      update(STEPS.NVM, "running", "node LTS");
      await host.runUpstreamInstall(workflowTools.npm.upstream);
      update(STEPS.NVM, "done", "node LTS");
    } else {
      update(STEPS.NVM, "skipped", "npm present");
    }
    if (!host.commandExists(workflowTools.herdr.command)) {
      update(STEPS.HERDR, "running", "latest");
      await host.runUpstreamInstall(workflowTools.herdr.upstream);
      update(STEPS.HERDR, "done", "latest");
    } else {
      update(STEPS.HERDR, "skipped", "present");
    }
    if (!host.commandExists(workflowTools.pi.command)) {
      update(STEPS.PI, "running", `latest + ${piPackages.length} packages`);
      await host.runUpstreamInstall(workflowTools.pi.upstream);
      await host.installPiPackages(piPackages);
      update(STEPS.PI, "done", `${piPackages.length} packages`);
    } else {
      update(STEPS.PI, "skipped", "present");
    }
    if (!host.commandExists(workflowTools.opencode.command)) {
      update(STEPS.OPENCODE, "running", "latest");
      await host.runUpstreamInstall(workflowTools.opencode.upstream);
      update(STEPS.OPENCODE, "done", "latest");
    } else {
      update(STEPS.OPENCODE, "skipped", "present");
    }
    if (!host.commandExists(workflowTools.zed.command)) {
      update(STEPS.ZED, "running", "latest");
      await host.runUpstreamInstall(workflowTools.zed.upstream);
      update(STEPS.ZED, "done", "latest");
    } else {
      update(STEPS.ZED, "skipped", "present");
    }
    if (!host.fileExists(join(home, ".agents/skills"))) {
      update(STEPS.SKILLS, "running", `${skillsList.length} skills`);
      await host.installSkills(skillsList);
      update(STEPS.SKILLS, "done", `${skillsList.length} skills`);
    } else {
      update(STEPS.SKILLS, "skipped", "present");
    }
    update(STEPS.STOW, "running", "home/ tree");
    const stowed = await stow(host, { skipGhostty: true, confirmConflicts: reRun });
    if (stowed.exitCode !== 0) {
      return stowed;
    }
    update(STEPS.STOW, "done", "linked");
    update(STEPS.MCP, "running", "mirroring XDG mcp");
    await mirrorOpenCodeMcp(host);
    update(STEPS.MCP, "done", "mcp key refreshed");
    const apiKeysCsv = (await host.prompt("API Keys (key=value CSV, empty skips): ")).trim();
    if (apiKeysCsv !== "") {
      const confirmed = await host.prompt("Write API Keys to /etc/environment? [y/N] ");
      if (isYes(confirmed)) {
        await host.writeEnvironment(
          mergeEnvironment(await host.readEnvironment(), parseApiKeyCsv(apiKeysCsv)),
        );
        update(STEPS.KEYS, "done", "merged into /etc/environment");
      } else {
        update(STEPS.KEYS, "skipped", "declined");
      }
    } else {
      update(STEPS.KEYS, "skipped", "empty");
    }
    let stderr = "";
    const ghosttyMissing = !host.commandExists(workflowTools.ghostty.command);
    const wantGhostty = ghosttyMissing && isYes(await host.prompt("Install Ghostty? [y/N] "));
    if (wantGhostty) {
      const ghostty = ghosttyPackageFor(pm);
      if (ghostty) {
        try {
          update(STEPS.GHOSTTY, "running", "installing");
          await host.installPackages([ghostty]);
          update(STEPS.GHOSTTY, "done", "installed");
        } catch {
          update(STEPS.GHOSTTY, "failed", "install failed");
          stderr = "Ghostty install failed.\n";
        }
      } else {
        update(STEPS.GHOSTTY, "failed", `not in Package Map for ${pm}`);
        stderr = `Ghostty is not in the Package Map for ${pm}.\n`;
      }
    } else {
      update(STEPS.GHOSTTY, "skipped", ghosttyMissing ? "declined" : "present");
    }
    if (host.commandExists(workflowTools.ghostty.command)) {
      await stow(host, { onlyGhostty: true });
    }
    let shellChanged = false;
    if (!isZsh(host.loginShell())) {
      update(STEPS.SHELL, "running", "zsh");
      await host.changeLoginShell(workflowTools.zsh.command);
      shellChanged = true;
      update(STEPS.SHELL, "done", "zsh");
    } else {
      update(STEPS.SHELL, "skipped", "already zsh");
    }
    if (!host.fileExists(join(home, ".local/bin/dotfiles"))) {
      update(STEPS.CLI, "running", "~/.local/bin");
      await host.linkDotfiles();
      update(STEPS.CLI, "done", "~/.local/bin");
    } else {
      update(STEPS.CLI, "skipped", "present");
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
  const checkTool = (tool: WorkflowTool) => {
    check(tool.label, host.commandExists(tool.command));
  };

  checkTool(workflowTools.zsh);
  check("Oh My Zsh", host.fileExists(join(home, ".oh-my-zsh")));
  check(
    "OMZ plugins",
    omzPlugins.every((plugin) =>
      host.fileExists(join(home, `.oh-my-zsh/custom/plugins/${plugin}`)),
    ),
  );
  checkTool(workflowTools.git);
  checkTool(workflowTools.stow);
  checkTool(workflowTools.npm);
  checkTool(workflowTools.bun);
  checkTool(workflowTools.pi);
  checkTool(workflowTools.herdr);
  checkTool(workflowTools.opencode);
  checkTool(workflowTools.zed);
  check("Skills", host.fileExists(join(home, ".agents/skills")));
  check("XDG MCP", host.fileExists(join(home, ".config/mcp/mcp.json")));
  check("login shell", isZsh(host.loginShell()));
  check("dotfiles PATH symlink", host.fileExists(join(home, ".local/bin/dotfiles")));
  if (!host.commandExists(workflowTools.ghostty.command)) {
    lines.push(`${workflowTools.ghostty.label}: missing (optional)`);
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

async function clean(host: Host): Promise<RunResult> {
  const backups = host.stowBackups();
  if (backups.length === 0) {
    return { exitCode: 0, stdout: "No Stow backups to clean.\n", stderr: "" };
  }
  const confirmed = isYes(
    await host.prompt(`Delete ${backups.length} Stow backup file(s)? [y/N] `),
  );
  if (!confirmed) {
    return {
      exitCode: 0,
      stdout: `Kept ${backups.length} Stow backup file(s):\n${backups.join("\n")}\n`,
      stderr: "",
    };
  }
  for (const path of backups) {
    host.removeFile(path);
  }
  return {
    exitCode: 0,
    stdout: `Deleted ${backups.length} Stow backup file(s):\n${backups.join("\n")}\n`,
    stderr: "",
  };
}

async function update(host: Host): Promise<RunResult> {
  let pull;
  try {
    pull = await host.pullRepo();
  } catch (error) {
    const message = error instanceof Error ? error.message : "git pull --ff-only failed";
    return {
      exitCode: 1,
      stdout: "",
      stderr: `Repo pull failed: ${message}\ndotfiles update needs a clean repo that fast-forwards from origin.\n`,
    };
  }
  const stowed = await stow(host);
  if (stowed.exitCode !== 0) {
    return stowed;
  }
  await mirrorOpenCodeMcp(host);
  return {
    exitCode: 0,
    stdout: `${pull}\nConfig synced: home/ re-Stowed into $HOME and OpenCode MCP refreshed.\n`,
    stderr: "",
  };
}

function workflowLooksPresent(host: Host): boolean {
  const home = host.homeDir();
  return (
    requiredWorkflowTools.every((tool) => host.commandExists(tool.command)) &&
    host.fileExists(join(home, ".oh-my-zsh")) &&
    omzPlugins.every((plugin) =>
      host.fileExists(join(home, `.oh-my-zsh/custom/plugins/${plugin}`)),
    ) &&
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
