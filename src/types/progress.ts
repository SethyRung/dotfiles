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
