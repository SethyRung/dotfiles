import type { ProgressFrame, ProgressStep } from "@/types/progress.ts";
import type { FakeHost } from "./fake-host.ts";

export function finalSteps(host: FakeHost): Map<string, ProgressStep> {
  return new Map(host.progressFrames.at(-1)!.steps.map((step) => [step.label, step]));
}

export function frameStep(frame: ProgressFrame, label: string): ProgressStep {
  return frame.steps.find((step) => step.label === label)!;
}
