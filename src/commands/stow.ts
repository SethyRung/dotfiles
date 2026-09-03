import type { Host } from "@/types/host.ts";
import type { RunResult, StowOptions } from "@/types/result.ts";

export async function stow(host: Host, options: StowOptions = {}): Promise<RunResult> {
  await host.stowTree(options);
  return { exitCode: 0, stdout: "", stderr: "" };
}

export async function stowCommand(host: Host): Promise<RunResult> {
  await host.linkDotfiles();
  return await stow(host);
}
