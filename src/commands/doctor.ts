import type { Host } from "@/types/host.ts";
import type { RunResult } from "@/types/result.ts";
import { statusCell } from "@/utils/panel.ts";
import { assessWorkflow } from "@/utils/workflow-health.ts";

function doctorRow(label: string, ok: boolean): string {
  return `  ${statusCell(ok)}${label}`;
}

export async function doctor(host: Host, options: { json?: boolean } = {}): Promise<RunResult> {
  let health: Awaited<ReturnType<typeof assessWorkflow>>;
  try {
    health = await assessWorkflow(host);
  } catch (error) {
    const message = error instanceof Error ? error.message : "doctor failed";
    return { exitCode: 1, stdout: "", stderr: `${message}\n` };
  }
  const requiredOk = health.requiredChecks.filter((check) => check.ok).length;
  const totalRequired = health.requiredChecks.length;
  const keysOk = health.keys.every((check) => check.ok);
  const exitCode =
    requiredOk === totalRequired && health.brokenStowLinks.length === 0 && keysOk ? 0 : 1;
  if (options.json) {
    return { exitCode, stdout: `${JSON.stringify(health)}\n`, stderr: "" };
  }
  const lines = [
    "DOTFILES  doctor",
    "",
    "Workflow",
    ...health.requiredChecks.map((check) => doctorRow(check.label, check.ok)),
    "",
    "Optional",
    health.optional.ghostty ? "  [ok]  Ghostty" : "  [skip] Ghostty",
  ];
  if (health.keys.length > 0) {
    lines.push("", "API Keys", ...health.keys.map((check) => doctorRow(check.name, check.ok)));
  }
  if (health.brokenStowLinks.length > 0) {
    lines.push("", "Stow", ...health.brokenStowLinks.map((link) => `  [!!]  ${link}`));
  }
  lines.push(
    "",
    requiredOk === totalRequired
      ? `${totalRequired} required ok`
      : `${requiredOk}/${totalRequired} required ok`,
  );
  return {
    exitCode,
    stdout: `${lines.join("\n")}\n`,
    stderr: "",
  };
}
