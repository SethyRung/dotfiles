export type RunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type StowOptions = {
  skipGhostty?: boolean;
  onlyGhostty?: boolean;
  confirmConflicts?: boolean;
};
