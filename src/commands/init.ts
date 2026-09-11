import { join } from "node:path";
import { stow } from "@/commands/stow.ts";
import { ghosttyPackageFor } from "@/consts/package-map.ts";
import { skillDir } from "@/consts/skills-list.ts";
import { miseToolsProgressDetail, workflowTools } from "@/consts/workflow-tools.ts";
import type { Host } from "@/types/host.ts";
import type { ProgressState, ProgressStep } from "@/types/progress.ts";
import type { RunResult } from "@/types/result.ts";
import {
  formatStorePath,
  parseApiKeyCsv,
  parseDotenv,
  resolveStorePath,
} from "@/utils/environment.ts";
import { mirrorMcp } from "@/utils/mcp.ts";
import type { DotfilesPreset } from "@/utils/preset.ts";
import { loadPreset } from "@/utils/preset.ts";
import { isYes, isZsh } from "@/utils/prompt.ts";
import { assessWorkflow } from "@/utils/workflow-health.ts";

const STEPS = {
  DISTRO: 0,
  OMZ: 1,
  OMZ_PLUGINS: 2,
  MISE: 3,
  STOW: 4,
  MISE_TOOLS: 5,
  PI_PACKAGES: 6,
  ZED: 7,
  SKILLS: 8,
  MCP: 9,
  KEYS: 10,
  GHOSTTY: 11,
  SHELL: 12,
  CLI: 13,
} as const;

function initialSteps(preset: DotfilesPreset): ProgressStep[] {
  const pending = (label: string, detail: string): ProgressStep => ({
    label,
    detail,
    state: "pending",
  });
  return [
    pending("Distro packages", "zsh, git, stow"),
    pending("Oh My Zsh", "latest"),
    pending("OMZ plugins", "autosuggestions, syntax-highlighting"),
    pending(workflowTools.mise.label, "latest"),
    pending("Stow", "home/ tree"),
    pending("Mise Tools", miseToolsProgressDetail),
    pending("pi packages", `${preset.piPackages.length} packages`),
    pending(workflowTools.zed.label, "latest"),
    pending("Skills", `${preset.skills.length} skills`),
    pending("MCP", "pi, OpenCode, Grok, Codex"),
    pending("API Keys", "will prompt"),
    pending(workflowTools.ghostty.label, "will prompt"),
    pending("login shell", "zsh"),
    pending("dotfiles CLI", "~/.local/bin"),
  ];
}

async function workflowLooksPresent(host: Host, preset: DotfilesPreset): Promise<boolean> {
  return (await assessWorkflow(host, preset)).isBootstrapped;
}

export async function init(host: Host, options: { yes?: boolean } = {}): Promise<RunResult> {
  const pm = host.packageManager();
  if (!pm) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: "Unknown package manager. Bootstrap needs apt, pacman, dnf, or zypper.\n",
    };
  }
  let preset: DotfilesPreset;
  try {
    preset = await loadPreset(host);
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed to load preset";
    return { exitCode: 1, stdout: "", stderr: `${message}\n` };
  }
  const reRun = await workflowLooksPresent(host, preset);
  if (reRun && !options.yes) {
    const cont = await host.prompt("Workflow already present. Continue? [y/N] ");
    if (!isYes(cont)) {
      return { exitCode: 0, stdout: "", stderr: "" };
    }
  }
  const home = host.homeDir();

  let envVars: Record<string, string> = {};
  let envResolvedPath = "/etc/environment";
  let envDisplayPath = "/etc/environment";
  let envConfirmed = false;

  const dotenvPath = join(host.repoDir(), ".env");
  const dotenvContent = await host.readFile(dotenvPath);
  const parsedDotenv = dotenvContent !== null ? parseDotenv(dotenvContent) : {};
  const dotenvKeys = Object.keys(parsedDotenv);

  if (options.yes) {
    envVars = parsedDotenv;
    envConfirmed = dotenvKeys.length > 0;
  } else if (dotenvKeys.length > 0) {
    const modifyPrompt =
      `Loaded environment variables from .env:\n  ${dotenvKeys.join(", ")}\n` +
      "Do you want to modify it? [y/N] ";
    const wantModify = isYes(await host.prompt(modifyPrompt));
    if (wantModify) {
      const mode = (await host.prompt("Override or Append? [o/A] ")).trim().toLowerCase();
      if (mode === "o" || mode === "override") {
        const csv = (await host.prompt("API Keys (key=value CSV): ")).trim();
        envVars = parseApiKeyCsv(csv);
      } else {
        const csv = (await host.prompt("API Keys to append (key=value CSV): ")).trim();
        envVars = { ...parsedDotenv, ...parseApiKeyCsv(csv) };
      }
    } else {
      envVars = parsedDotenv;
    }
  } else {
    const apiKeysCsv = (await host.prompt("API Keys (key=value CSV, empty skips): ")).trim();
    if (apiKeysCsv !== "") {
      envVars = parseApiKeyCsv(apiKeysCsv);
    }
  }

  if (!options.yes && Object.keys(envVars).length > 0) {
    const locationMenu =
      "Store location:\n" +
      "1) /etc/environment (system-wide) [default]\n" +
      "2) ~/.zshenv\n" +
      "3) ~/.profile\n" +
      "4) Custom path\n" +
      "Select [1-4, default 1]: ";
    const choice = (await host.prompt(locationMenu)).trim();
    let storeTarget = choice;
    if (choice === "4") {
      const custom = (await host.prompt("Custom store location: ")).trim();
      storeTarget = custom !== "" ? custom : "/etc/environment";
    }
    envResolvedPath = resolveStorePath(storeTarget, home);
    envDisplayPath = formatStorePath(envResolvedPath, home);
    const confirmed = await host.prompt(`Write API Keys to ${envDisplayPath}? [y/N] `);
    envConfirmed = isYes(confirmed);
  }

  let wantGhostty = false;
  const ghosttyConfigured = preset.tools.ghostty !== undefined;
  const ghosttyMissing = !host.commandExists(workflowTools.ghostty.command);
  if (ghosttyConfigured) {
    wantGhostty = preset.tools.ghostty === true && ghosttyMissing;
  } else if (ghosttyMissing && !options.yes) {
    wantGhostty = isYes(await host.prompt("Install Ghostty? [y/N] "));
  }

  const session = host.startProgress(`Distro packages: ${pm}`, initialSteps(preset));
  const update = (i: number, state: ProgressState, detail: string) => {
    session.update(i, state, detail);
  };
  try {
    const pkgs = preset.distroPackagesFor(pm).filter((name) => !host.commandExists(name));
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
    if (!preset.isToolEnabled("omzPlugins", true)) {
      update(STEPS.OMZ_PLUGINS, "skipped", "disabled in preset");
    } else {
      const missingPlugins = preset.omzPlugins.filter(
        (plugin) => !host.fileExists(join(home, `.oh-my-zsh/custom/plugins/${plugin}`)),
      );
      if (missingPlugins.length > 0) {
        update(STEPS.OMZ_PLUGINS, "running", missingPlugins.join(", "));
        for (const plugin of missingPlugins) {
          await host.runUpstreamInstall(plugin);
        }
        update(STEPS.OMZ_PLUGINS, "done", `${preset.omzPlugins.length} plugins`);
      } else {
        update(STEPS.OMZ_PLUGINS, "skipped", "present");
      }
    }
    if (!host.commandExists(workflowTools.mise.command)) {
      update(STEPS.MISE, "running", "latest");
      await host.runUpstreamInstall(workflowTools.mise.upstream);
      update(STEPS.MISE, "done", "latest");
    } else {
      update(STEPS.MISE, "skipped", "present");
    }
    update(STEPS.STOW, "running", "home/ tree");
    const stowed = await stow(host, {
      skipGhostty: true,
      confirmConflicts: reRun && !options.yes,
    });
    if (stowed.exitCode !== 0) {
      return stowed;
    }
    update(STEPS.STOW, "done", "linked");
    const piWasMissing = !host.commandExists(workflowTools.pi.command);
    update(STEPS.MISE_TOOLS, "running", miseToolsProgressDetail);
    await host.installMiseTools();
    update(STEPS.MISE_TOOLS, "done", miseToolsProgressDetail);
    if (!preset.isToolEnabled("piPackages", true)) {
      update(STEPS.PI_PACKAGES, "skipped", "disabled in preset");
    } else if (piWasMissing) {
      update(STEPS.PI_PACKAGES, "running", `${preset.piPackages.length} packages`);
      await host.installPiPackages(preset.piPackages);
      update(STEPS.PI_PACKAGES, "done", `${preset.piPackages.length} packages`);
    } else {
      update(STEPS.PI_PACKAGES, "skipped", "present");
    }
    if (!preset.isToolEnabled("zed", true)) {
      update(STEPS.ZED, "skipped", "disabled in preset");
    } else if (!host.commandExists(workflowTools.zed.command)) {
      update(STEPS.ZED, "running", "latest");
      await host.runUpstreamInstall(workflowTools.zed.upstream);
      update(STEPS.ZED, "done", "latest");
    } else {
      update(STEPS.ZED, "skipped", "present");
    }
    if (!preset.isToolEnabled("skills", true)) {
      update(STEPS.SKILLS, "skipped", "disabled in preset");
    } else {
      const missingSkillSpecs = preset.skills.filter(
        (spec) => !host.fileExists(skillDir(home, spec)),
      );
      if (missingSkillSpecs.length > 0) {
        update(STEPS.SKILLS, "running", `${missingSkillSpecs.length} of ${preset.skills.length}`);
        await host.installSkills(missingSkillSpecs);
        update(STEPS.SKILLS, "done", `${preset.skills.length} skills`);
      } else {
        update(STEPS.SKILLS, "skipped", "present");
      }
    }
    update(STEPS.MCP, "running", "translating");
    await mirrorMcp(host);
    update(STEPS.MCP, "done", "pi, OpenCode, Grok, Codex");

    if (Object.keys(envVars).length > 0) {
      if (envConfirmed) {
        await host.mergeApiKeys(envVars, envResolvedPath);
        update(STEPS.KEYS, "done", `merged into ${envDisplayPath}`);
      } else {
        update(STEPS.KEYS, "skipped", "declined");
      }
    } else {
      update(STEPS.KEYS, "skipped", "empty");
    }
    let stderr = "";
    if (preset.tools.ghostty === false) {
      update(STEPS.GHOSTTY, "skipped", "disabled in preset");
    } else if (wantGhostty) {
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
    update(STEPS.CLI, "running", "~/.local/bin");
    await host.linkDotfiles();
    update(STEPS.CLI, "done", "~/.local/bin");
    if (shellChanged && !options.yes) {
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
  } finally {
    session.done();
  }
}
