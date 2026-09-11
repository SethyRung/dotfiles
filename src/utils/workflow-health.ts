import { join } from "node:path";
import { piPackageDir } from "@/consts/pi-packages.ts";
import { skillDir } from "@/consts/skills-list.ts";
import { workflowTools } from "@/consts/workflow-tools.ts";
import type { Host } from "@/types/host.ts";
import type { DotfilesPreset } from "@/utils/preset.ts";
import { mcpMatchesPreset } from "@/utils/mcp.ts";
import { loadPreset } from "@/utils/preset.ts";
import { isZsh } from "@/utils/prompt.ts";

export type WorkflowCheck = {
  label: string;
  ok: boolean;
};

export type ApiKeyCheck = {
  name: string;
  ok: boolean;
};

export type WorkflowHealth = {
  isComplete: boolean;
  isBootstrapped: boolean;
  requiredChecks: WorkflowCheck[];
  optional: {
    ghostty: boolean;
  };
  keys: ApiKeyCheck[];
  brokenStowLinks: string[];
};

export async function assessWorkflow(host: Host, preset?: DotfilesPreset): Promise<WorkflowHealth> {
  const activePreset = preset ?? (await loadPreset(host));
  const home = host.homeDir();
  const zsh = host.commandExists(workflowTools.zsh.command);
  const omz = host.fileExists(join(home, ".oh-my-zsh"));
  const plugins = activePreset.omzPlugins.every((plugin) =>
    host.fileExists(join(home, `.oh-my-zsh/custom/plugins/${plugin}`)),
  );
  const git = host.commandExists(workflowTools.git.command);
  const stowOk = host.commandExists(workflowTools.stow.command);
  const mise = host.commandExists(workflowTools.mise.command);
  const npm = host.commandExists(workflowTools.npm.command);
  const bun = host.commandExists(workflowTools.bun.command);
  const pi = host.commandExists(workflowTools.pi.command);
  const piPkgs = activePreset.piPackages.every((pkg) => host.fileExists(piPackageDir(home, pkg)));
  const herdr = host.commandExists(workflowTools.herdr.command);
  const opencode = host.commandExists(workflowTools.opencode.command);
  const grok = host.commandExists(workflowTools.grok.command);
  const codex = host.commandExists(workflowTools.codex.command);
  const gh = host.commandExists(workflowTools.gh.command);
  const agy = host.commandExists(workflowTools.agy.command);
  const zed = host.commandExists(workflowTools.zed.command);
  const skills = activePreset.skills.every((spec) => host.fileExists(skillDir(home, spec)));
  const mcp = await mcpMatchesPreset(host, activePreset.mcp);
  const shell = isZsh(host.loginShell());
  const pathOk = host.fileExists(join(home, ".local/bin/dotfiles"));
  const ghostty = host.commandExists(workflowTools.ghostty.command);
  const presentKeys = new Set(await host.listApiKeyNames());
  const keys: ApiKeyCheck[] = activePreset.apiKeys.map((name) => ({
    name,
    ok: presentKeys.has(name),
  }));
  const stowReport = await host.stowTree({ dryRun: true, skipGhostty: true });
  const brokenStowLinks = [...new Set([...stowReport.linked, ...stowReport.backedUp])];

  const checkOmzPlugins = activePreset.isToolEnabled("omzPlugins", true);
  const checkPiPackages = activePreset.isToolEnabled("piPackages", true);
  const checkZed = activePreset.isToolEnabled("zed", true);
  const checkSkills = activePreset.isToolEnabled("skills", true);

  const requiredChecks: WorkflowCheck[] = [
    { label: "zsh", ok: zsh },
    { label: "Oh My Zsh", ok: omz },
    ...(checkOmzPlugins ? [{ label: "OMZ plugins", ok: plugins }] : []),
    { label: "git", ok: git },
    { label: "stow", ok: stowOk },
    { label: workflowTools.mise.label, ok: mise },
    { label: "npm", ok: npm },
    { label: "bun", ok: bun },
    { label: "pi", ok: pi },
    ...(checkPiPackages ? [{ label: "pi packages", ok: piPkgs }] : []),
    { label: "herdr", ok: herdr },
    { label: "OpenCode", ok: opencode },
    { label: workflowTools.grok.label, ok: grok },
    { label: workflowTools.codex.label, ok: codex },
    { label: workflowTools.gh.label, ok: gh },
    { label: workflowTools.agy.label, ok: agy },
    ...(checkZed ? [{ label: "Zed", ok: zed }] : []),
    ...(checkSkills ? [{ label: "Skills", ok: skills }] : []),
    { label: "MCP", ok: mcp },
    { label: "login shell", ok: shell },
    { label: "PATH symlink", ok: pathOk },
  ];

  const isComplete = requiredChecks.every((check) => check.ok) && keys.every((check) => check.ok);
  const isBootstrapped = [
    zsh,
    omz,
    checkOmzPlugins ? plugins : true,
    git,
    stowOk,
    mise,
    npm,
    bun,
    pi,
    checkPiPackages ? piPkgs : true,
    herdr,
    opencode,
    grok,
    codex,
    gh,
    agy,
    checkZed ? zed : true,
    checkSkills ? skills : true,
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
