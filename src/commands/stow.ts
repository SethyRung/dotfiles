import type { Host } from "@/types/host.ts";
import type { RunResult, StowOptions } from "@/types/result.ts";
import { mirrorOpenCodeMcp } from "@/utils/mcp.ts";
import { formatStowReport } from "@/utils/stow.ts";

export async function stow(host: Host, options: StowOptions = {}): Promise<RunResult> {
  const report = await host.stowTree(options);
  return { exitCode: 0, stdout: formatStowReport(report), stderr: "" };
}

export async function stowCommand(host: Host, options: StowOptions = {}): Promise<RunResult> {
  if (!options.dryRun) {
    await host.linkDotfiles();
  }
  const stowed = await stow(host, options);
  if (!options.dryRun) {
    await mirrorOpenCodeMcp(host);
  }
  let stdout = stowed.stdout;
  if (options.dryRun) {
    stdout += "\n(dry run: would link ~/.local/bin/dotfiles)\n";
  }
  return { exitCode: 0, stdout, stderr: "" };
}
