import type { Host } from "@/types/host.ts";
import type { RunResult } from "@/types/result.ts";
import { assessWorkflow } from "@/utils/workflow-health.ts";

function doctorCell(ok: boolean): string {
  return ok ? "[ok]  " : "[!!]  ";
}

function doctorRow(label: string, ok: boolean): string {
  return `  ${doctorCell(ok)}${label}`;
}

export async function doctor(host: Host): Promise<RunResult> {
  const health = await assessWorkflow(host);
  const requiredOk = health.requiredChecks.filter((check) => check.ok).length;
  const totalRequired = health.requiredChecks.length;
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
    lines.push("", "API Keys", ...health.keys.map((name) => `  [ok]  ${name}`));
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
    exitCode: requiredOk === totalRequired && health.brokenStowLinks.length === 0 ? 0 : 1,
    stdout: `${lines.join("\n")}\n`,
    stderr: "",
  };
}
