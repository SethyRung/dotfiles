import type { Host } from "@/types/host.ts";
import type { RunResult } from "@/types/result.ts";
import { isYes } from "@/utils/prompt.ts";

export async function clean(host: Host): Promise<RunResult> {
  const backups = host.stowBackups();
  if (backups.length === 0) {
    return { exitCode: 0, stdout: "No Stow backups to clean.\n", stderr: "" };
  }
  const confirmed = isYes(
    await host.prompt(`Delete ${backups.length} Stow backup file(s)? [y/N] `),
  );
  if (!confirmed) {
    return {
      exitCode: 0,
      stdout: `Kept ${backups.length} Stow backup file(s):\n${backups.join("\n")}\n`,
      stderr: "",
    };
  }
  for (const path of backups) {
    host.removeFile(path);
  }
  return {
    exitCode: 0,
    stdout: `Deleted ${backups.length} Stow backup file(s):\n${backups.join("\n")}\n`,
    stderr: "",
  };
}
