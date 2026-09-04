import { clean } from "@/commands/clean.ts";
import { doctor } from "@/commands/doctor.ts";
import { init } from "@/commands/init.ts";
import { stowCommand } from "@/commands/stow.ts";
import { sync } from "@/commands/sync.ts";
import { commandHelpTexts, helpText } from "@/consts/help.ts";
import type { Host } from "@/types/host.ts";
import type { RunResult } from "@/types/result.ts";

export type { RunResult };

export async function run(args: string[], host: Host): Promise<RunResult> {
  const command = args[0];

  if (command === undefined || command === "-h" || command === "--help") {
    return { exitCode: 0, stdout: helpText, stderr: "" };
  }

  const help = commandHelpTexts[command];
  if (help !== undefined) {
    const rest = args.slice(1);
    if (rest.includes("-h") || rest.includes("--help")) {
      return { exitCode: 0, stdout: help, stderr: "" };
    }
    if (command === "stow") {
      let dryRun = false;
      for (const arg of rest) {
        if (arg === "--dry-run") {
          dryRun = true;
        } else {
          const message = arg.startsWith("-")
            ? `unknown option: ${arg}`
            : `unexpected argument: ${arg}`;
          return { exitCode: 1, stdout: "", stderr: `${message}\n\n${help}` };
        }
      }
      return await stowCommand(host, { dryRun });
    }

    if (command === "sync") {
      let dryRun = false;
      for (const arg of rest) {
        if (arg === "--dry-run") {
          dryRun = true;
        } else {
          const message = arg.startsWith("-")
            ? `unknown option: ${arg}`
            : `unexpected argument: ${arg}`;
          return { exitCode: 1, stdout: "", stderr: `${message}\n\n${help}` };
        }
      }
      return await sync(host, { dryRun });
    }

    if (rest.length > 0) {
      const invalid = rest[0];
      const message = invalid.startsWith("-")
        ? `unknown option: ${invalid}`
        : `unexpected argument: ${invalid}`;
      return { exitCode: 1, stdout: "", stderr: `${message}\n\n${help}` };
    }

    if (command === "init") {
      return await init(host);
    }
    if (command === "doctor") {
      return await doctor(host);
    }
    if (command === "clean") {
      return await clean(host);
    }
  }

  return { exitCode: 1, stdout: "", stderr: `unknown command: ${command}\n\n${helpText}` };
}
