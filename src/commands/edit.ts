import { join } from "node:path";
import type { Host } from "@/types/host.ts";
import type { RunResult } from "@/types/result.ts";

export async function edit(host: Host): Promise<RunResult> {
  const target = join(host.repoDir(), "dotfiles.json");
  try {
    await host.openEditor(target);
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed to open editor";
    return { exitCode: 1, stdout: "", stderr: `${message}\n` };
  }
  return { exitCode: 0, stdout: `Opened ${target} in $EDITOR.\n`, stderr: "" };
}
