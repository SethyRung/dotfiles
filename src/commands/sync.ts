import { stow } from "@/commands/stow.ts";
import type { Host } from "@/types/host.ts";
import type { RunResult, StowOptions } from "@/types/result.ts";
import { mirrorOpenCodeMcp } from "@/utils/mcp.ts";

export async function sync(host: Host, options: StowOptions = {}): Promise<RunResult> {
  if (options.dryRun) {
    const stowed = await stow(host, { dryRun: true });
    return { exitCode: 0, stdout: stowed.stdout, stderr: "" };
  }

  let pull;
  try {
    pull = await host.pullRepo();
  } catch (error) {
    const message = error instanceof Error ? error.message : "git pull --ff-only failed";
    return {
      exitCode: 1,
      stdout: "",
      stderr: `Repo pull failed: ${message}\ndotfiles sync needs a clean repo that fast-forwards from origin.\n`,
    };
  }
  const stowed = await stow(host);
  if (stowed.exitCode !== 0) {
    return stowed;
  }
  await mirrorOpenCodeMcp(host);
  return {
    exitCode: 0,
    stdout: `${pull}\n${stowed.stdout}Config synced: home/ re-Stowed into $HOME and OpenCode MCP refreshed.\n`,
    stderr: "",
  };
}
