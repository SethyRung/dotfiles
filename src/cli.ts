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

export async function run(_args: string[], host: Host): Promise<RunResult> {
  if (!host.commandExists("bun")) {
    await host.runUpstreamInstall("bun");
  }
  return { exitCode: 0, stdout: helpText, stderr: "" };
}
