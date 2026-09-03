import { join } from "node:path";
import { omzPlugins } from "@/consts/omz-plugins.ts";
import { skillDir, skillsList } from "@/consts/skills-list.ts";
import { workflowTools } from "@/consts/workflow-tools.ts";
import type { Host } from "@/types/host.ts";
import type { RunResult } from "@/types/result.ts";
import { isZsh } from "@/utils/prompt.ts";

function doctorCell(ok: boolean): string {
  return ok ? "[ok]  " : "[!!]  ";
}

function doctorRow(label: string, ok: boolean): string {
  return `  ${doctorCell(ok)}${label}`;
}

export async function doctor(host: Host): Promise<RunResult> {
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
  const keys = await host.environmentKeyNames();
  const broken = host.brokenStowLinks();
  const required = [
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
    mcp,
    shell,
    pathOk,
  ];
  const requiredOk = required.filter(Boolean).length;
  const lines = [
    "DOTFILES  doctor",
    "",
    "Workflow",
    doctorRow("zsh", zsh),
    doctorRow("Oh My Zsh", omz),
    doctorRow("OMZ plugins", plugins),
    doctorRow("git", git),
    doctorRow("stow", stowOk),
    doctorRow(workflowTools.mise.label, mise),
    doctorRow("npm", npm),
    doctorRow("bun", bun),
    doctorRow("pi", pi),
    doctorRow("herdr", herdr),
    doctorRow("OpenCode", opencode),
    doctorRow("Zed", zed),
    doctorRow("Skills", skills),
    doctorRow("XDG MCP", mcp),
    doctorRow("login shell", shell),
    doctorRow("PATH symlink", pathOk),
    "",
    "Optional",
    ghostty ? "  [ok]  Ghostty" : "  [skip] Ghostty",
  ];
  if (keys.length > 0) {
    lines.push("", "API Keys", ...keys.map((name) => `  [ok]  ${name}`));
  }
  if (broken.length > 0) {
    lines.push("", "Stow", ...broken.map((link) => `  [!!]  ${link}`));
  }
  lines.push(
    "",
    requiredOk === required.length
      ? `${required.length} required ok`
      : `${requiredOk}/${required.length} required ok`,
  );
  return {
    exitCode: requiredOk === required.length && broken.length === 0 ? 0 : 1,
    stdout: `${lines.join("\n")}\n`,
    stderr: "",
  };
}
