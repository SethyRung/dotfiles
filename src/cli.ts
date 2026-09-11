import { clean } from "@/commands/clean.ts";
import { doctor } from "@/commands/doctor.ts";
import { init } from "@/commands/init.ts";
import { stowCommand } from "@/commands/stow.ts";
import { sync } from "@/commands/sync.ts";
import { commandHelpTexts, helpText } from "@/consts/help.ts";
import type { Host } from "@/types/host.ts";
import type { RunResult } from "@/types/result.ts";
import packageJson from "../package.json" with { type: "json" };

export type { RunResult };

function parseAllowedFlags(
  rest: string[],
  help: string,
  allowed: readonly string[],
): { flags: Set<string> } | RunResult {
  const flags = new Set<string>();
  for (const arg of rest) {
    if (allowed.includes(arg)) {
      flags.add(arg);
    } else {
      const message = arg.startsWith("-")
        ? `unknown option: ${arg}`
        : `unexpected argument: ${arg}`;
      return { exitCode: 1, stdout: "", stderr: `${message}\n\n${help}` };
    }
  }
  return { flags };
}

function parseDryRun(rest: string[], help: string): { dryRun: boolean } | RunResult {
  const parsed = parseAllowedFlags(rest, help, ["--dry-run"]);
  if ("exitCode" in parsed) {
    return parsed;
  }
  return { dryRun: parsed.flags.has("--dry-run") };
}

export async function run(args: string[], host: Host): Promise<RunResult> {
  const command = args[0];

  if (command === undefined || command === "-h" || command === "--help") {
    return { exitCode: 0, stdout: helpText, stderr: "" };
  }

  if (command === "--version") {
    if (args.includes("-h") || args.includes("--help")) {
      return { exitCode: 0, stdout: helpText, stderr: "" };
    }
    return { exitCode: 0, stdout: `${packageJson.version}\n`, stderr: "" };
  }

  const help = commandHelpTexts[command];
  if (help !== undefined) {
    const rest = args.slice(1);
    if (rest.includes("-h") || rest.includes("--help")) {
      return { exitCode: 0, stdout: help, stderr: "" };
    }
    if (command === "stow") {
      const parsed = parseDryRun(rest, help);
      if ("exitCode" in parsed) {
        return parsed;
      }
      return await stowCommand(host, parsed);
    }

    if (command === "sync") {
      const parsed = parseDryRun(rest, help);
      if ("exitCode" in parsed) {
        return parsed;
      }
      return await sync(host, parsed);
    }

    if (command === "doctor") {
      const parsed = parseAllowedFlags(rest, help, ["--json"]);
      if ("exitCode" in parsed) {
        return parsed;
      }
      return await doctor(host, { json: parsed.flags.has("--json") });
    }

    if (command === "init") {
      const parsed = parseAllowedFlags(rest, help, ["--yes"]);
      if ("exitCode" in parsed) {
        return parsed;
      }
      return await init(host, { yes: parsed.flags.has("--yes") });
    }

    if (command === "clean") {
      const parsed = parseAllowedFlags(rest, help, ["--yes"]);
      if ("exitCode" in parsed) {
        return parsed;
      }
      return await clean(host, { yes: parsed.flags.has("--yes") });
    }

    if (rest.length > 0) {
      const invalid = rest[0];
      const message = invalid.startsWith("-")
        ? `unknown option: ${invalid}`
        : `unexpected argument: ${invalid}`;
      return { exitCode: 1, stdout: "", stderr: `${message}\n\n${help}` };
    }
  }

  return { exitCode: 1, stdout: "", stderr: `unknown command: ${command}\n\n${helpText}` };
}
