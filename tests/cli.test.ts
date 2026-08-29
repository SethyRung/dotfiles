import { expect, test } from "bun:test";
import { join } from "node:path";
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
    promptAnswers?: string[];
    environmentFile?: string;
  } = {},
): Host & {
  upstreamInstalls: string[];
  packagesRequested: string[];
  piPackagesRequested: string[];
  skillsRequested: string[];
  backups: string[];
  linked: string[];
  prompts: string[];
} {
  const present = new Set(commands);
  const files = new Set(extras.files ?? []);
  const upstreamInstalls: string[] = [];
  const packagesRequested: string[] = [];
  const piPackagesRequested: string[] = [];
  const skillsRequested: string[] = [];
  const homeDir = extras.homeDir ?? "/fake-home";
  let loginShell = extras.loginShell ?? null;
  const environmentKeys = extras.environmentKeys ?? {};
  const stowLinks = extras.brokenStowLinks ?? [];
  const tree = extras.homeTree ?? [];
  const backups: string[] = [];
  const linked: string[] = [];
  const prompts: string[] = [];
  const promptAnswers = extras.promptAnswers ?? [];
  let environmentFile = extras.environmentFile ?? "";
  const clock = extras.now ?? toDayJS("1970-01-01T00:00:00.000Z");
  const packageManager = extras.packageManager ?? null;
  const installError = extras.installError;
  return {
    upstreamInstalls,
    packagesRequested,
    piPackagesRequested,
    skillsRequested,
    backups,
    linked,
    prompts,
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
    async changeLoginShell(shell) {
      loginShell = shell;
    },
    async linkDotfiles() {
      files.add(`${homeDir}/.local/bin/dotfiles`);
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
    async installPiPackages(packages) {
      piPackagesRequested.push(...packages);
    },
    async installSkills(specs) {
      skillsRequested.push(...specs);
    },
    async prompt(message) {
      prompts.push(message);
      return promptAnswers.shift() ?? "";
    },
    async readEnvironment() {
      return environmentFile;
    },
    async writeEnvironment(content) {
      environmentFile = content;
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

test("init requests the Oh My Zsh Upstream Install on the Host", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).toContain("oh-my-zsh");
});

test("a curated zshrc is Stowed without Android SDK paths or out-of-scope aliases", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".zshrc"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toEqual([".zshrc"]);
  const zshrc = await Bun.file(join(import.meta.dir, "../home/.zshrc")).text();
  expect(zshrc).toContain('ZSH_THEME="bira"');
  expect(zshrc).toContain("git");
  expect(zshrc).toContain("docker");
  expect(zshrc).toContain("zsh-autosuggestions");
  expect(zshrc).toContain("zsh-syntax-highlighting");
  expect(zshrc).toContain("$HOME/.bun");
  expect(zshrc).toContain("HERDR_INSTALL_DIR");
  expect(zshrc).toContain("$HOME/.local/bin");
  expect(zshrc).not.toMatch(/ANDROID/i);
  expect(zshrc).not.toContain("alias op=");
  expect(zshrc).not.toContain("alias csp=");
  expect(zshrc).not.toContain("alias cpsp=");
  expect(zshrc).not.toContain("alias zshconfig=");
});

test("login shell is changed to zsh", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.loginShell()).toBe("zsh");
});

test("`~/.local/bin/dotfiles` is a symlink to the stub", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], { homeDir: home, packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.fileExists(`${home}/.local/bin/dotfiles`)).toBe(true);
});

test("init succeeds even when the current session PATH does not yet include ~/.local/bin", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], { homeDir: home, packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.fileExists(`${home}/.local/bin/dotfiles`)).toBe(true);
  expect(host.commandExists("dotfiles")).toBe(false);
});

test("init requests the herdr Upstream Install on the Host", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).toContain("herdr");
});

test("herdr config.toml is Stowed into the fake $HOME", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".config/herdr/config.toml"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toEqual([".config/herdr/config.toml"]);
  const toml = await Bun.file(join(import.meta.dir, "../home/.config/herdr/config.toml")).text();
  expect(toml).toContain('prefix = "ctrl+space"');
  expect(toml).toContain('name = "vesper"');
  expect(toml).toContain("[ui]");
});

test("init does not Stow herdr logs and sockets", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [
      ".config/herdr/config.toml",
      ".config/herdr/herdr-client.log",
      ".config/herdr/herdr.sock",
    ],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toEqual([".config/herdr/config.toml"]);
});

test("init requests latest pi and the agreed pi packages on the Host", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).toContain("pi");
  expect(host.piPackagesRequested).toEqual([
    "npm:pi-subagents",
    "npm:pi-mcp-adapter",
    "npm:@juicesharp/rpiv-ask-user-question",
    "npm:@juicesharp/rpiv-todo",
    "npm:@narumitw/pi-retry",
    "npm:pi-zentui",
    "npm:@ogulcancelik/pi-herdr",
    "npm:@ollama/pi-web-search",
  ]);
});

test("restored pi settings do not include default model or provider", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".pi/agent/settings.json"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toContain(".pi/agent/settings.json");
  const settings = await Bun.file(join(import.meta.dir, "../home/.pi/agent/settings.json")).json();
  expect(settings).not.toHaveProperty("defaultModel");
  expect(settings).not.toHaveProperty("defaultProvider");
  expect(settings).not.toHaveProperty("model");
  expect(settings).not.toHaveProperty("provider");
  expect(settings.packages).toContain("npm:pi-subagents");
});

test("APPEND_SYSTEM, prompts, and extensions are restored; auth, sessions, caches, and model stores are not", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [
      ".pi/agent/APPEND_SYSTEM.md",
      ".pi/agent/prompts/init.md",
      ".pi/agent/extensions/herdr-agent-state.ts",
      ".pi/agent/keybindings.json",
      ".pi/agent/zentui.json",
      ".pi/agent/auth.json",
      ".pi/agent/sessions/x.jsonl",
      ".pi/agent/mcp-cache.json",
      ".pi/agent/models-store.json",
    ],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toContain(".pi/agent/APPEND_SYSTEM.md");
  expect(host.linked).toContain(".pi/agent/prompts/init.md");
  expect(host.linked).toContain(".pi/agent/extensions/herdr-agent-state.ts");
  expect(host.linked).toContain(".pi/agent/keybindings.json");
  expect(host.linked).toContain(".pi/agent/zentui.json");
  expect(host.linked).not.toContain(".pi/agent/auth.json");
  expect(host.linked).not.toContain(".pi/agent/sessions/x.jsonl");
  expect(host.linked).not.toContain(".pi/agent/mcp-cache.json");
  expect(host.linked).not.toContain(".pi/agent/models-store.json");
  const keybindings = await Bun.file(
    join(import.meta.dir, "../home/.pi/agent/keybindings.json"),
  ).json();
  expect(keybindings["tui.input.newLine"]).toEqual(["alt+enter"]);
  const zentui = await Bun.file(join(import.meta.dir, "../home/.pi/agent/zentui.json")).json();
  expect(zentui).toHaveProperty("colorSources");
});

test("Skills are requested via skills.sh, not by snapshotting skill files as the install mechanism", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.skillsRequested).toEqual([
    "vercel-labs/skills@find-skills",
    "mattpocock/skills@grill-me",
    "mattpocock/skills@grill-with-docs",
    "mattpocock/skills@to-spec",
    "mattpocock/skills@to-tickets",
    "firecrawl/anydoc@convert-documents-to-markdown",
    "mattpocock/skills@code-review",
    "mattpocock/skills@implement",
    "mattpocock/skills@improve-codebase-architecture",
    "mattpocock/skills@resolving-merge-conflicts",
    "mattpocock/skills@tdd",
    "mattpocock/skills@teach",
    "mattpocock/skills@prototype",
    "mattpocock/skills@wait-what",
  ]);
  expect(host.linked.some((rel) => rel.startsWith(".agents/skills/"))).toBe(false);
});

test("XDG MCP config is Stowed", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".config/mcp/mcp.json"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toContain(".config/mcp/mcp.json");
  expect(host.linked).not.toContain(".pi/agent/mcp.json");
  const mcp = await Bun.file(join(import.meta.dir, "../home/.config/mcp/mcp.json")).json();
  expect(mcp.mcpServers).toHaveProperty("mobile-mcp");
  expect(mcp.mcpServers).toHaveProperty("bun");
});

test("empty API Key CSV skips the /etc/environment write", async () => {
  const existing = 'PATH="/usr/bin"\nKEEP=yes\n';
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    environmentFile: existing,
    promptAnswers: [""],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts[0]).toContain("key=value");
  expect(await host.readEnvironment()).toBe(existing);
});

test("non-empty CSV prompts for confirmation before writing", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    environmentFile: 'PATH="/usr/bin"\n',
    promptAnswers: ["OPENROUTER_API_KEY=sk-secret", "n"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts[1]).toContain("/etc/environment");
});

test("accepting merges keys only; other lines in the file remain", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    environmentFile: 'PATH="/usr/bin"\nKEEP=yes\n',
    promptAnswers: ["OPENROUTER_API_KEY=sk-secret", "y"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(await host.readEnvironment()).toBe(
    'PATH="/usr/bin"\nKEEP=yes\nOPENROUTER_API_KEY=sk-secret\n',
  );
});

test("declining confirmation does not write", async () => {
  const existing = 'PATH="/usr/bin"\nKEEP=yes\n';
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    environmentFile: existing,
    promptAnswers: ["OPENROUTER_API_KEY=sk-secret", "n"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(await host.readEnvironment()).toBe(existing);
});

test("CLI output and logs never contain API Key values", async () => {
  const secret = "sk-secret-do-not-leak";
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    environmentFile: 'PATH="/usr/bin"\n',
    promptAnswers: [`OPENROUTER_API_KEY=${secret}`, "y"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).not.toContain(secret);
  expect(result.stderr).not.toContain(secret);
  expect(host.prompts.join("")).not.toContain(secret);
});

test("default / no skips Ghostty package and config", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".zshrc", ".config/ghostty/config"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts.some((p) => p.includes("Install Ghostty?"))).toBe(true);
  expect(host.packagesRequested).toEqual(["zsh", "git", "stow"]);
  expect(host.linked).toEqual([".zshrc"]);
});

test("yes on a Distro with a mapping installs Ghostty and Stows its config", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".zshrc", ".config/ghostty/config"],
    promptAnswers: ["", "y"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.packagesRequested).toEqual(["zsh", "git", "stow", "ghostty"]);
  expect(host.linked).toContain(".config/ghostty/config");
  const cfg = await Bun.file(join(import.meta.dir, "../home/.config/ghostty/config")).text();
  expect(cfg).toContain("theme=Vercel");
  expect(cfg).toContain("Geist Mono");
});

test("yes on a Distro without a mapping warns and does not abort the rest of init", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "zypper",
    homeTree: [".zshrc", ".config/ghostty/config"],
    promptAnswers: ["", "y"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toContain("Ghostty");
  expect(host.packagesRequested).toEqual(["zsh", "git", "stow"]);
  expect(host.linked).not.toContain(".config/ghostty/config");
  expect(host.loginShell()).toBe("zsh");
});
