import type { ProgressFrame, ProgressSession, ProgressStep } from "@/types/progress.ts";
import type { StowOptions, StowReport } from "@/types/result.ts";

export type PackageManager = "apt" | "pacman" | "dnf" | "zypper";

export type Host = {
  commandExists(command: string): boolean;
  runUpstreamInstall(tool: string): Promise<void>;
  installMiseTools(): Promise<void>;
  packageManager(): PackageManager | null;
  installPackages(packages: string[]): Promise<void>;
  homeDir(): string;
  fileExists(path: string): boolean;
  loginShell(): string | null;
  changeLoginShell(shell: string): Promise<void>;
  reboot(): Promise<void>;
  pullRepo(): Promise<string>;
  linkDotfiles(): Promise<void>;
  listApiKeyNames(): Promise<string[]>;
  brokenStowLinks(): string[];
  stowBackups(): string[];
  homeTree(): string[];
  removeFile(path: string): void;
  stowTree(options?: StowOptions): Promise<StowReport>;
  installPiPackages(packages: string[]): Promise<void>;
  installSkills(specs: string[]): Promise<void>;
  prompt(message: string): Promise<string>;
  startProgress(title: string, steps: ProgressStep[]): ProgressSession;
  progress(frame: ProgressFrame): void;
  mergeApiKeys(keys: Record<string, string>): Promise<void>;
  readFile(path: string): Promise<string | null>;
  writeFile(path: string, content: string): Promise<void>;
};
