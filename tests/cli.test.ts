import { expect, test } from "bun:test";
import { run } from "../src/cli.ts";
import type { Host, PackageManager } from "../src/host.ts";
import { backupStamp, toDayJS, type Dayjs } from "../src/time.ts";

function createFakeHost(
  commands: string[] = [],
  extras: {
    files?: string[];
    homeDir?: string;
    loginShell?: string | null;
    environmentKeys?: Record<string, string>;
    brokenStowLinks?: string[];
    homeTree?: string[];
    now?: Dayjs;
    packageManager?: PackageManager | null;
    installError?: string;
  } = {},
): Host & {
  upstreamInstalls: string[];
  packagesRequested: string[];
  backups: string[];
  linked: string[];
} {
  const present = new Set(commands);
  const files = new Set(extras.files ?? []);
  const upstreamInstalls: string[] = [];
  const packagesRequested: string[] = [];
  const homeDir = extras.homeDir ?? "/fake-home";
  const loginShell = extras.loginShell ?? null;
  const environmentKeys = extras.environmentKeys ?? {};
  const stowLinks = extras.brokenStowLinks ?? [];
  const tree = extras.homeTree ?? [];
  const backups: string[] = [];
  const linked: string[] = [];
  const clock = extras.now ?? toDayJS("1970-01-01T00:00:00.000Z");
  const packageManager = extras.packageManager ?? null;
  const installError = extras.installError;
  return {
    upstreamInstalls,
    packagesRequested,
    backups,
    linked,
    commandExists(command) {
      return present.has(command);
    },
    async runUpstreamInstall(tool) {
      upstreamInstalls.push(tool);
      present.add(tool);
    },
    packageManager() {
      return packageManager;
    },
    async installPackages(packages) {
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
    fileExists(path) {
      return files.has(path);
    },
    loginShell() {
      return loginShell;
    },
    async environmentKeyNames() {
      return Object.keys(environmentKeys);
    },
    brokenStowLinks() {
      return stowLinks;
    },
    homeTree() {
      return tree;
    },
    backup(path) {
      const dest = `${path}.${backupStamp(clock)}`;
      backups.push(dest);
      files.delete(path);
      return dest;
    },
    async stow(relPaths) {
      for (const rel of relPaths) {
        linked.push(rel);
        files.add(`${homeDir}/${rel}`);
      }
    },
  };
}

test("dotfiles help lists init, doctor, and stow", async () => {
  const host = createFakeHost(["bun"]);
  const result = await run(["--help"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("init");
  expect(result.stdout).toContain("doctor");
  expect(result.stdout).toContain("stow");
});

test("with bun missing, the stub requests the bun Upstream Install, then the CLI runs", async () => {
  const host = createFakeHost();
  const result = await run(["--help"], host);
  expect(host.upstreamInstalls).toEqual(["bun"]);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("init");
});

test("with bun present, the stub does not request bun again", async () => {
  const host = createFakeHost(["bun"]);
  await run(["--help"], host);
  expect(host.upstreamInstalls).toEqual([]);
});

test("on an empty Host, doctor reports required Workflow pieces missing and exits non-zero", async () => {
  const host = createFakeHost();
  const result = await run(["doctor"], host);
  expect(result.exitCode).not.toBe(0);
  for (const piece of [
    "zsh",
    "Oh My Zsh",
    "git",
    "stow",
    "pi",
    "herdr",
    "Skills",
    "XDG MCP",
    "login shell",
    "dotfiles PATH symlink",
  ]) {
    expect(result.stdout).toContain(`${piece}: missing`);
  }
});

test("Ghostty missing is a warning, not a required failure", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["zsh", "git", "stow", "bun", "pi", "herdr"], {
    homeDir: home,
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.agents/skills`,
      `${home}/.config/mcp/mcp.json`,
      `${home}/.local/bin/dotfiles`,
    ],
    loginShell: "/bin/zsh",
  });
  const result = await run(["doctor"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("Ghostty: missing (optional)");
});

test("doctor never prints API Key values", async () => {
  const host = createFakeHost(["bun"], {
    environmentKeys: { OPENROUTER_API_KEY: "sk-secret-do-not-leak" },
  });
  const result = await run(["doctor"], host);
  expect(result.stdout).toContain("OPENROUTER_API_KEY");
  expect(result.stdout).not.toContain("sk-secret-do-not-leak");
  expect(result.stderr).not.toContain("sk-secret-do-not-leak");
});

test("doctor reports broken Stow links", async () => {
  const host = createFakeHost(["bun"], {
    brokenStowLinks: ["/fake-home/.zshrc"],
  });
  const result = await run(["doctor"], host);
  expect(result.stdout).toContain("/fake-home/.zshrc");
});

test("dotfiles stow on a clean fake $HOME links the home/ tree", async () => {
  const host = createFakeHost(["bun"], {
    homeTree: [".zshrc", ".config/herdr/config.toml"],
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toEqual([".zshrc", ".config/herdr/config.toml"]);
  expect(host.backups).toEqual([]);
});

test("when a target file already exists, a timestamped backup is created and Stow then links", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".zshrc"],
    files: [`${home}/.zshrc`],
    now: toDayJS("2026-01-01_10:30:20", "YYYY-MM-DD_HH:mm:ss"),
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(host.backups).toEqual([`${home}/.zshrc.2026-01-01_10:30:20`]);
  expect(host.linked).toEqual([".zshrc"]);
});

test("herdr logs and sockets are not linked", async () => {
  const host = createFakeHost(["bun"], {
    homeTree: [
      ".config/herdr/config.toml",
      ".config/herdr/logs/session.log",
      ".config/herdr/herdr.sock",
    ],
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toEqual([".config/herdr/config.toml"]);
});

test("on a Host with a known package manager, init requests zsh, git, and stow from the Package Map", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.packagesRequested).toEqual(["zsh", "git", "stow"]);
});

test("on a Host with an unknown package manager, init fails before any package or Upstream Install", async () => {
  const host = createFakeHost(["bun"]);
  const result = await run(["init"], host);
  expect(result.exitCode).not.toBe(0);
  expect(host.packagesRequested).toEqual([]);
  expect(host.upstreamInstalls).toEqual([]);
  expect(result.stderr).toContain("apt");
  expect(result.stderr).toContain("pacman");
  expect(result.stderr).toContain("dnf");
  expect(result.stderr).toContain("zypper");
});

test("git config is not written", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], { homeDir: home, packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.packagesRequested).toContain("git");
  expect(host.fileExists(`${home}/.gitconfig`)).toBe(false);
  expect(host.fileExists(`${home}/.config/git/config`)).toBe(false);
  expect(host.linked).not.toContain(".gitconfig");
  expect(host.linked).not.toContain(".config/git/config");
});

test("a failed required Distro package install fails the command", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    installError: "apt-get failed",
  });
  const result = await run(["init"], host);
  expect(result.exitCode).not.toBe(0);
  expect(host.upstreamInstalls).toEqual([]);
});
