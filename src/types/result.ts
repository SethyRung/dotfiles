export type RunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type StowReport = {
  linked: string[];
  backedUp: string[];
  skipped: string[];
};

export type StowOptions = {
  skipGhostty?: boolean;
  onlyGhostty?: boolean;
  confirmConflicts?: boolean;
  dryRun?: boolean;
};
