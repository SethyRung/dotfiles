import { join } from "node:path";
import { omzPlugins } from "@/consts/omz-plugins.ts";
import { skillDir, skillsList } from "@/consts/skills-list.ts";
import { workflowTools } from "@/consts/workflow-tools.ts";
import type { Host } from "@/types/host.ts";
import { isZsh } from "@/utils/prompt.ts";

export type WorkflowCheck = {
  label: string;
  ok: boolean;
};

export type WorkflowHealth = {
  isComplete: boolean;
  isBootstrapped: boolean;
  requiredChecks: WorkflowCheck[];
  optional: {
    ghostty: boolean;
  };
  keys: string[];
  brokenStowLinks: string[];
};

export async function assessWorkflow(host: Host): Promise<WorkflowHealth> {
  const home = host.homeDir();
  const zsh = host.commandExists(workflowTools.zsh.command);
  const omz = host.fileExists(join(home, ".oh-my-zsh"));
  const plugins = omzPlugins.every((plugin) =>
    host.fileExists(join(home, `.oh-my-zsh/custom/plugins/${plugin}`)),
  );
  const git = host.commandExists(workflowTools.git.command);
  const stowOk = host.commandExists(workflowTools.stow.command);
  const mise = host.commandExists(workflowTools.mise.command);
  const npm = host.commandExists(workflowTools.npm.command);
  const bun = host.commandExists(workflowTools.bun.command);
  const pi = host.commandExists(workflowTools.pi.command);
  const herdr = host.commandExists(workflowTools.herdr.command);
  const opencode = host.commandExists(workflowTools.opencode.command);
  const zed = host.commandExists(workflowTools.zed.command);
  const skills = skillsList.every((spec) => host.fileExists(skillDir(home, spec)));
  const mcp = host.fileExists(join(home, ".config/mcp/mcp.json"));
  const shell = isZsh(host.loginShell());
  const pathOk = host.fileExists(join(home, ".local/bin/dotfiles"));
  const ghostty = host.commandExists(workflowTools.ghostty.command);
  const keys = await host.listApiKeyNames();
  const brokenStowLinks = host.brokenStowLinks();

  const requiredChecks: WorkflowCheck[] = [
    { label: "zsh", ok: zsh },
    { label: "Oh My Zsh", ok: omz },
    { label: "OMZ plugins", ok: plugins },
    { label: "git", ok: git },
    { label: "stow", ok: stowOk },
    { label: workflowTools.mise.label, ok: mise },
    { label: "npm", ok: npm },
    { label: "bun", ok: bun },
    { label: "pi", ok: pi },
    { label: "herdr", ok: herdr },
    { label: "OpenCode", ok: opencode },
    { label: "Zed", ok: zed },
    { label: "Skills", ok: skills },
    { label: "XDG MCP", ok: mcp },
    { label: "login shell", ok: shell },
    { label: "PATH symlink", ok: pathOk },
  ];

  const isComplete = requiredChecks.every((check) => check.ok);
  const isBootstrapped = [
    zsh,
    omz,
    plugins,
    git,
    stowOk,
    mise,
    npm,
    bun,
    pi,
    herdr,
    opencode,
    zed,
    skills,
    shell,
  ].every(Boolean);

  return {
    isComplete,
    isBootstrapped,
    requiredChecks,
    optional: { ghostty },
    keys,
    brokenStowLinks,
  };
}
