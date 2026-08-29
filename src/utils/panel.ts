import type { ProgressFrame, ProgressStep } from "@/types/progress.ts";

const bannerLines = [
  "██████╗  ██████╗ ████████╗███████╗██╗██╗     ███████╗███████╗",
  "██╔══██╗██╔═══██╗╚══██╔══╝██╔════╝██║██║     ██╔════╝██╔════╝",
  "██║  ██╗██║   ██║   ██║   █████╗  ██║██║     █████╗  ███████╗",
  "██║  ██╗██║   ██║   ██║   ██╔══╝  ██║██║     ██╔══╝  ╚════██║",
  "██████╔╝╚██████╔╝   ██║   ██║     ██║███████╗███████╗███████║",
  "╚═════╝  ╚═════╝    ╚═╝   ╚═╝     ╚═╝╚══════╝╚══════╝╚══════╝",
];

const banner = `${bannerLines.join("\n")}\n`;

const spinnerCells = ["[\\]   ", "[|]   ", "[/]   ", "[-]   "];

function statusCell(step: ProgressStep, phase: number): string {
  switch (step.state) {
    case "done":
      return "[ok]  ";
    case "skipped":
      return "[skip]";
    case "failed":
      return "[!!]  ";
    case "running":
      return spinnerCells[phase % spinnerCells.length];
    default:
      return "[--]  ";
  }
}

export function renderPanel(
  frame: ProgressFrame,
  spinnerPhase: number,
  elapsedSec: number,
): string[] {
  const rule = `  ${"-".repeat(44)}`;
  const rows = frame.steps.map(
    (step) => `  ${statusCell(step, spinnerPhase)} ${step.label.padEnd(17)}${step.detail}`,
  );
  const current = frame.steps.findIndex((step) => step.state === "running") + 1;
  const footer =
    current > 0
      ? `  step ${current}/${frame.steps.length} - ${elapsedSec}s elapsed`
      : `  Bootstrap complete. (${elapsedSec}s)`;
  return [rule, ...rows, rule, footer];
}

export function renderBanner(title: string): string {
  return `${banner}\n  ${title}\n\n`;
}

export function spinnerFrames(): number {
  return spinnerCells.length;
}
