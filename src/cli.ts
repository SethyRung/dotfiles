import { join } from "node:path";
import type { Host } from "./host.ts";

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
  if (args[0] === "doctor") {
    return await doctor(host);
  }
  return { exitCode: 0, stdout: helpText, stderr: "" };
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
