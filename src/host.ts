export type Host = {
  commandExists(command: string): boolean;
  runUpstreamInstall(tool: string): Promise<void>;
  homeDir(): string;
  fileExists(path: string): boolean;
  loginShell(): string | null;
  environmentKeyNames(): Promise<string[]>;
  brokenStowLinks(): string[];
};
