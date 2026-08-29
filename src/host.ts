export type PackageManager = "apt" | "pacman" | "dnf" | "zypper";

export type Host = {
  commandExists(command: string): boolean;
  runUpstreamInstall(tool: string): Promise<void>;
  packageManager(): PackageManager | null;
  installPackages(packages: string[]): Promise<void>;
  homeDir(): string;
  fileExists(path: string): boolean;
  loginShell(): string | null;
  changeLoginShell(shell: string): Promise<void>;
  linkDotfiles(): Promise<void>;
  environmentKeyNames(): Promise<string[]>;
  brokenStowLinks(): string[];
  homeTree(): string[];
  backup(path: string): string;
  stow(relPaths: string[]): Promise<void>;
  installPiPackages(packages: string[]): Promise<void>;
  installSkills(specs: string[]): Promise<void>;
  prompt(message: string): Promise<string>;
  readEnvironment(): Promise<string>;
  writeEnvironment(content: string): Promise<void>;
  readFile(path: string): Promise<string | null>;
  writeFile(path: string, content: string): Promise<void>;
};
