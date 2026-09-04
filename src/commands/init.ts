import { join } from "node:path";
import { stow } from "@/commands/stow.ts";
import { omzPlugins } from "@/consts/omz-plugins.ts";
import { ghosttyPackageFor, packagesFor } from "@/consts/package-map.ts";
import { piPackages } from "@/consts/pi-packages.ts";
import { skillDir, skillsList } from "@/consts/skills-list.ts";
import { workflowTools } from "@/consts/workflow-tools.ts";
import type { Host } from "@/types/host.ts";
import type { ProgressState, ProgressStep } from "@/types/progress.ts";
import type { RunResult } from "@/types/result.ts";
import { parseApiKeyCsv } from "@/utils/environment.ts";
import { mirrorOpenCodeMcp } from "@/utils/mcp.ts";
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

const miseToolsDetail = "bun, herdr, node, opencode, pi";

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
    pending(workflowTools.mise.label, "latest"),
    pending("Stow", "home/ tree"),
    pending("Mise Tools", miseToolsDetail),
    pending("pi packages", `${piPackages.length} packages`),
    pending(workflowTools.zed.label, "latest"),
    pending("Skills", `${skillsList.length} skills`),
    pending("OpenCode MCP", "mcp key"),
    pending("API Keys", "will prompt"),
    pending(workflowTools.ghostty.label, "will prompt"),
    pending("login shell", "zsh"),
    pending("dotfiles CLI", "~/.local/bin"),
  ];
}

async function workflowLooksPresent(host: Host): Promise<boolean> {
  return (await assessWorkflow(host)).isBootstrapped;
}

export async function init(host: Host): Promise<RunResult> {
  const pm = host.packageManager();
  if (!pm) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: "Unknown package manager. Bootstrap needs apt, pacman, dnf, or zypper.\n",
    };
  }
  const reRun = await workflowLooksPresent(host);
  if (reRun) {
    const cont = await host.prompt("Workflow already present. Continue? [y/N] ");
    if (!isYes(cont)) {
      return { exitCode: 0, stdout: "", stderr: "" };
    }
  }
  const home = host.homeDir();
  const session = host.startProgress(`Distro packages: ${pm}`, initialSteps());
  const update = (i: number, state: ProgressState, detail: string) => {
    session.update(i, state, detail);
  };
  try {
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
    if (!host.commandExists(workflowTools.mise.command)) {
      update(STEPS.MISE, "running", "latest");
      await host.runUpstreamInstall(workflowTools.mise.upstream);
      update(STEPS.MISE, "done", "latest");
    } else {
      update(STEPS.MISE, "skipped", "present");
    }
    update(STEPS.STOW, "running", "home/ tree");
    const stowed = await stow(host, { skipGhostty: true, confirmConflicts: reRun });
    if (stowed.exitCode !== 0) {
      return stowed;
    }
    update(STEPS.STOW, "done", "linked");
    const piWasMissing = !host.commandExists(workflowTools.pi.command);
    update(STEPS.MISE_TOOLS, "running", miseToolsDetail);
    await host.installMiseTools();
    update(STEPS.MISE_TOOLS, "done", miseToolsDetail);
    if (piWasMissing) {
      update(STEPS.PI_PACKAGES, "running", `${piPackages.length} packages`);
      await host.installPiPackages(piPackages);
      update(STEPS.PI_PACKAGES, "done", `${piPackages.length} packages`);
    } else {
      update(STEPS.PI_PACKAGES, "skipped", "present");
    }
    if (!host.commandExists(workflowTools.zed.command)) {
      update(STEPS.ZED, "running", "latest");
      await host.runUpstreamInstall(workflowTools.zed.upstream);
      update(STEPS.ZED, "done", "latest");
    } else {
      update(STEPS.ZED, "skipped", "present");
    }
    const missingSkillSpecs = skillsList.filter((spec) => !host.fileExists(skillDir(home, spec)));
    if (missingSkillSpecs.length > 0) {
      update(STEPS.SKILLS, "running", `${missingSkillSpecs.length} of ${skillsList.length}`);
      await host.installSkills(missingSkillSpecs);
      update(STEPS.SKILLS, "done", `${skillsList.length} skills`);
    } else {
      update(STEPS.SKILLS, "skipped", "present");
    }
    update(STEPS.MCP, "running", "mirroring XDG mcp");
    await mirrorOpenCodeMcp(host);
    update(STEPS.MCP, "done", "mcp key refreshed");
    const apiKeysCsv = (await host.prompt("API Keys (key=value CSV, empty skips): ")).trim();
    if (apiKeysCsv !== "") {
      const confirmed = await host.prompt("Write API Keys to /etc/environment? [y/N] ");
      if (isYes(confirmed)) {
        await host.mergeApiKeys(parseApiKeyCsv(apiKeysCsv));
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
    update(STEPS.CLI, "running", "~/.local/bin");
    await host.linkDotfiles();
    update(STEPS.CLI, "done", "~/.local/bin");
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
  } finally {
    session.done();
  }
}
