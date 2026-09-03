export type ProgressState = "pending" | "running" | "done" | "skipped" | "failed";

export type ProgressStep = {
  label: string;
  detail: string;
  state: ProgressState;
};

export type ProgressFrame = {
  title: string;
  steps: ProgressStep[];
};

export type ProgressSession = {
  update(stepIndex: number, state: ProgressState, detail?: string): void;
  done(): void;
};
