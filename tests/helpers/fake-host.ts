import { defaultMcp, type McpServer } from "@/config.ts";
import { skillsList } from "@/consts/skills-list.ts";
import { requiredWorkflowCommands } from "@/consts/workflow-tools.ts";
import type { Host, PackageManager } from "@/types/host.ts";
import type {
  ProgressFrame,
  ProgressSession,
  ProgressState,
  ProgressStep,
} from "@/types/progress.ts";
import type { StowOptions, StowReport } from "@/types/result.ts";
import { mergeEnvironment } from "@/utils/environment.ts";
import { openCodeMcpFromCanonical, piMcpFromCanonical } from "@/utils/mcp.ts";
import { isYes } from "@/utils/prompt.ts";
import { isGhosttyConfig, isStowJunk } from "@/utils/stow.ts";
import { backupStamp, parseDate } from "@/utils/time.ts";

export const presentWorkflowCommands: string[] = [...requiredWorkflowCommands];

export function skillDirs(home: string): string[] {
  return skillsList.map((spec) => `${home}/.agents/skills/${spec.split("@")[1] ?? spec}`);
}

function tomlMcpServers(servers: Record<string, McpServer>): string {
  const translated = piMcpFromCanonical(servers);
  const lines: string[] = [];
  for (const [name, spec] of Object.entries(translated)) {
    lines.push(`[mcp_servers.${name}]`);
    if (spec.url != null) {
      lines.push(`url = ${JSON.stringify(spec.url)}`);
    }
    if (spec.command != null) {
      lines.push(`command = ${JSON.stringify(spec.command)}`);
    }
    if (spec.args != null) {
      lines.push(`args = [${spec.args.map((arg) => JSON.stringify(arg)).join(", ")}]`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function mcpAgentFiles(
  home: string,
  servers: Record<string, McpServer> = defaultMcp,
): { files: string[]; fileContents: Record<string, string> } {
  const files = [
    `${home}/.pi/agent/mcp.json`,
    `${home}/.config/opencode/opencode.json`,
    `${home}/.grok/config.toml`,
    `${home}/.codex/config.toml`,
  ];
  const fileContents = {
    [`${home}/.pi/agent/mcp.json`]: `${JSON.stringify({ mcpServers: piMcpFromCanonical(servers) }, null, 2)}\n`,
    [`${home}/.config/opencode/opencode.json`]: `${JSON.stringify({ mcp: openCodeMcpFromCanonical(servers) }, null, 2)}\n`,
    [`${home}/.grok/config.toml`]: tomlMcpServers(servers),
    [`${home}/.codex/config.toml`]: tomlMcpServers(servers),
  };
  return { files, fileContents };
}

export function mcpSource(
  repoDir: string,
  servers: Record<string, { url?: string; command?: string; args?: string[] }>,
): Record<string, string> {
  return {
    [`${repoDir}/dotfiles.json`]: JSON.stringify({ mcp: servers }),
  };
}

export type FakeHost = Host & {
  upstreamInstalls: string[];
  packagesRequested: string[];
  piPackagesRequested: string[];
  skillsRequested: string[];
  backups: string[];
  removedFiles: string[];
  linked: string[];
  prompts: string[];
  reboots: number;
  repoPulls: number;
  progressFrames: ProgressFrame[];
  fileContents: Record<string, string>;
  dotfilesLinks: number;
  miseToolsCalls: number;
  actions: string[];
  environmentFile: string;
  readEnvironment(): Promise<string>;
  writeEnvironment(content: string): Promise<void>;
};

export function createFakeHost(
  commands: string[] = [],
  extras: {
    files?: string[];
    homeDir?: string;
    repoDir?: string;
    loginShell?: string | null;
    environmentKeys?: Record<string, string>;
    brokenStowLinks?: string[];
    stowBackups?: string[];
    homeTree?: string[];
    treeContents?: Record<string, string>;
    fileContents?: Record<string, string>;
    now?: Date;
    packageManager?: PackageManager | null;
    installError?: string;
    upstreamInstallError?: string;
    installMiseToolsError?: boolean;
    rebootError?: boolean;
    promptAnswers?: string[];
    environmentFile?: string;
    pullRepoOutput?: string;
    pullRepoError?: string;
    repoLinks?: string[];
    staleLinks?: string[];
  } = {},
): FakeHost {
  const present = new Set(commands);
  const files = new Set(extras.files ?? []);
  const upstreamInstalls: string[] = [];
  const packagesRequested: string[] = [];
  const piPackagesRequested: string[] = [];
  const skillsRequested: string[] = [];
  const homeDir = extras.homeDir ?? "/fake-home";
  const repoDir = extras.repoDir ?? "/fake-repo";
  let loginShell = extras.loginShell ?? null;
  const environmentKeys = extras.environmentKeys ?? {};
  const stowLinks = extras.brokenStowLinks ?? [];
  const stowBackupList = extras.stowBackups ?? [];
  const removedFiles: string[] = [];
  const tree = extras.homeTree ?? [];
  const fileContents: Record<string, string> = { ...(extras.fileContents ?? {}) };
  const backups: string[] = [];
  const linked: string[] = [];
  const prompts: string[] = [];
  const promptAnswers = extras.promptAnswers ?? [];
  const progressFrames: ProgressFrame[] = [];
  let environmentFile = extras.environmentFile ?? "";
  const clock = extras.now ?? parseDate("1970-01-01T00:00:00.000Z");
  const packageManager = extras.packageManager ?? null;
  const installError = extras.installError;
  const upstreamInstallError = extras.upstreamInstallError;
  const installMiseToolsError = extras.installMiseToolsError;
  const rebootError = extras.rebootError;
  const pullRepoOutput = extras.pullRepoOutput ?? "Already up to date.";
  const pullRepoError = extras.pullRepoError;
  const repoLinks = new Set(extras.repoLinks ?? []);
  const staleLinks = new Set(extras.staleLinks ?? []);
  let repoPulls = 0;
  let reboots = 0;
  let dotfilesLinks = 0;
  let miseToolsCalls = 0;
  const actions: string[] = [];
  return {
    upstreamInstalls,
    packagesRequested,
    piPackagesRequested,
    skillsRequested,
    backups,
    removedFiles,
    linked,
    prompts,
    get reboots() {
      return reboots;
    },
    get repoPulls() {
      return repoPulls;
    },
    get dotfilesLinks() {
      return dotfilesLinks;
    },
    get miseToolsCalls() {
      return miseToolsCalls;
    },
    progressFrames,
    fileContents,
    actions,
    commandExists(command) {
      return present.has(command);
    },
    async runUpstreamInstall(tool) {
      actions.push(`upstream:${tool}`);
      upstreamInstalls.push(tool);
      if (upstreamInstallError === tool) {
        throw new Error(`${tool} Upstream Install failed`);
      }
      present.add(tool);
    },
    packageManager() {
      return packageManager;
    },
    async installPackages(packages) {
      actions.push(`packages:${packages.join(",")}`);
      if (installError) {
        throw new Error(installError);
      }
      packagesRequested.push(...packages);
      for (const name of packages) {
        present.add(name);
      }
    },
    homeDir() {
      return homeDir;
    },
    repoDir() {
      return repoDir;
    },
    fileExists(path) {
      return files.has(path);
    },
    loginShell() {
      return loginShell;
    },
    async changeLoginShell(shell) {
      loginShell = shell;
    },
    async reboot() {
      reboots += 1;
      if (rebootError) {
        throw new Error("reboot failed");
      }
    },
    async pullRepo() {
      repoPulls += 1;
      if (pullRepoError) {
        throw new Error(pullRepoError);
      }
      return pullRepoOutput;
    },
    async linkDotfiles() {
      actions.push("link-dotfiles");
      dotfilesLinks += 1;
      files.add(`${homeDir}/.local/bin/dotfiles`);
    },
    async listApiKeyNames() {
      if (Object.keys(environmentKeys).length > 0) {
        return Object.keys(environmentKeys);
      }
      const names = new Set<string>();
      const sources = [
        environmentFile,
        fileContents[`${homeDir}/.zshenv`] ?? "",
        fileContents[`${homeDir}/.profile`] ?? "",
      ];
      for (const text of sources) {
        for (const line of text.split("\n")) {
          let trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) {
            continue;
          }
          if (trimmed.startsWith("export ")) {
            trimmed = trimmed.slice(7).trim();
          }
          const eq = trimmed.indexOf("=");
          if (eq <= 0) {
            continue;
          }
          names.add(trimmed.slice(0, eq));
        }
      }
      return [...names];
    },
    async mergeApiKeys(keys, targetPath = "/etc/environment") {
      actions.push("merge-api-keys");
      if (targetPath === "/etc/environment") {
        environmentFile = mergeEnvironment(environmentFile, keys);
      } else {
        const existing = fileContents[targetPath] ?? "";
        fileContents[targetPath] = mergeEnvironment(existing, keys);
        files.add(targetPath);
      }
    },
    brokenStowLinks() {
      return stowLinks;
    },
    stowBackups() {
      return [...stowBackupList];
    },
    homeTree() {
      return tree;
    },
    removeFile(path) {
      removedFiles.push(path);
      files.delete(path);
    },
    async stowTree(options: StowOptions = {}): Promise<StowReport> {
      const report: StowReport = { linked: [], backedUp: [], skipped: [] };
      let rels = tree.filter((rel) => {
        if (isStowJunk(rel)) {
          return false;
        }
        if (options.onlyGhostty) {
          return isGhosttyConfig(rel);
        }
        if (options.skipGhostty) {
          return !isGhosttyConfig(rel);
        }
        return true;
      });
      if (options.confirmConflicts) {
        const conflicts = rels.filter((rel) => files.has(`${homeDir}/${rel}`));
        if (conflicts.length > 0) {
          prompts.push("Overwrite existing files with Stow? [y/N] ");
          const answer = promptAnswers.shift() ?? "";
          if (!isYes(answer)) {
            rels = rels.filter((rel) => !conflicts.includes(rel));
          }
        }
      }
      for (const rel of rels) {
        const dest = `${homeDir}/${rel}`;
        const isRepoLink = repoLinks.has(dest);
        const isStale = staleLinks.has(dest);
        const exists = files.has(dest);

        if (isRepoLink) {
          report.skipped.push(dest);
          if (extras.treeContents?.[rel] != null) {
            fileContents[dest] = extras.treeContents[rel];
          }
          if (!options.dryRun) {
            linked.push(rel);
          }
          continue;
        }

        if (exists && !isStale) {
          report.backedUp.push(dest);
          report.linked.push(dest);
          if (!options.dryRun) {
            const bkp = `${dest}.${backupStamp(clock)}`;
            backups.push(bkp);
            files.delete(dest);
            linked.push(rel);
            files.add(dest);
            repoLinks.add(dest);
            if (extras.treeContents?.[rel] != null) {
              fileContents[dest] = extras.treeContents[rel];
            }
          }
        } else {
          if (isStale && !options.dryRun) {
            staleLinks.delete(dest);
          }
          report.linked.push(dest);
          if (!options.dryRun) {
            linked.push(rel);
            files.add(dest);
            repoLinks.add(dest);
            if (extras.treeContents?.[rel] != null) {
              fileContents[dest] = extras.treeContents[rel];
            }
          }
        }
      }
      if (!options.dryRun) {
        actions.push(`stow:${rels.join(",")}`);
      }
      return report;
    },
    async installMiseTools() {
      actions.push("mise-tools");
      miseToolsCalls += 1;
      if (installMiseToolsError) {
        throw new Error("mise install failed");
      }
    },
    async installPiPackages(packages) {
      actions.push("pi-packages");
      piPackagesRequested.push(...packages);
    },
    async installSkills(specs) {
      actions.push("skills");
      skillsRequested.push(...specs);
      for (const spec of specs) {
        const name = spec.split("@")[1] ?? spec;
        files.add(`${homeDir}/.agents/skills/${name}`);
      }
    },
    async prompt(message) {
      prompts.push(message);
      return promptAnswers.shift() ?? "";
    },
    startProgress(title: string, steps: ProgressStep[]): ProgressSession {
      const currentSteps = steps.map((step) => ({ ...step }));
      const pushFrame = () => {
        progressFrames.push({
          title,
          steps: currentSteps.map((s) => ({ ...s })),
        });
      };
      pushFrame();
      return {
        update(i: number, state: ProgressState, detail?: string) {
          currentSteps[i] = {
            ...currentSteps[i],
            state,
            detail: detail ?? currentSteps[i].detail,
          };
          pushFrame();
        },
        done() {},
      };
    },
    progress(frame) {
      progressFrames.push({ title: frame.title, steps: frame.steps.map((step) => ({ ...step })) });
    },
    get environmentFile() {
      return environmentFile;
    },
    async readEnvironment() {
      return environmentFile;
    },
    async writeEnvironment(content) {
      environmentFile = content;
    },
    async readFile(path) {
      return fileContents[path] ?? null;
    },
    async writeFile(path, content) {
      fileContents[path] = content;
      files.add(path);
    },
  };
}
