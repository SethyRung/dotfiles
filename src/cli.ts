import { clean } from "@/commands/clean.ts";
import { doctor } from "@/commands/doctor.ts";
import { init } from "@/commands/init.ts";
import { stowCommand } from "@/commands/stow.ts";
import { sync } from "@/commands/sync.ts";
import { helpText } from "@/consts/help.ts";
import type { Host } from "@/types/host.ts";
import type { RunResult } from "@/types/result.ts";

export type { RunResult };

export async function run(args: string[], host: Host): Promise<RunResult> {
  const command = args[0];
  if (command === "init") {
    return await init(host);
  }
  if (command === "doctor") {
    return await doctor(host);
  }
  if (command === "stow") {
    return await stowCommand(host);
  }
  if (command === "clean") {
    return await clean(host);
  }
  if (command === "sync") {
    return await sync(host);
  }
  if (command === undefined || command === "-h" || command === "--help") {
    return { exitCode: 0, stdout: helpText, stderr: "" };
  }
  return { exitCode: 1, stdout: "", stderr: `unknown command: ${command}\n\n${helpText}` };
}
