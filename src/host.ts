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
};
