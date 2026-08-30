import { expect, test } from "bun:test";
import { join } from "node:path";
import { run } from "@/cli.ts";
import type { Host, PackageManager } from "@/types/host.ts";
import type { ProgressFrame } from "@/types/progress.ts";
import { backupStamp, toDayJS, type Dayjs } from "@/utils/time.ts";

function createFakeHost(
  commands: string[] = [],
  extras: {
    files?: string[];
    homeDir?: string;
    loginShell?: string | null;
    environmentKeys?: Record<string, string>;
    brokenStowLinks?: string[];
    homeTree?: string[];
    treeContents?: Record<string, string>;
    fileContents?: Record<string, string>;
    now?: Dayjs;
    packageManager?: PackageManager | null;
    installError?: string;
    upstreamInstallError?: string;
    rebootError?: boolean;
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
  reboots: number;
  progressFrames: ProgressFrame[];
  fileContents: Record<string, string>;
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
  const fileContents: Record<string, string> = { ...(extras.fileContents ?? {}) };
  const backups: string[] = [];
  const linked: string[] = [];
  const prompts: string[] = [];
  const promptAnswers = extras.promptAnswers ?? [];
  const progressFrames: ProgressFrame[] = [];
  let environmentFile = extras.environmentFile ?? "";
  const clock = extras.now ?? toDayJS("1970-01-01T00:00:00.000Z");
  const packageManager = extras.packageManager ?? null;
  const installError = extras.installError;
  const upstreamInstallError = extras.upstreamInstallError;
  const rebootError = extras.rebootError;
  let reboots = 0;
  return {
    upstreamInstalls,
    packagesRequested,
    piPackagesRequested,
    skillsRequested,
    backups,
    linked,
    prompts,
    get reboots() {
      return reboots;
    },
    progressFrames,
    fileContents,
    commandExists(command) {
      return present.has(command);
    },
    async runUpstreamInstall(tool) {
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
    async reboot() {
      reboots += 1;
      if (rebootError) {
        throw new Error("reboot failed");
      }
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
        const dest = `${homeDir}/${rel}`;
        files.add(dest);
        if (extras.treeContents?.[rel] != null) {
          fileContents[dest] = extras.treeContents[rel];
        }
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
    progress(frame) {
      progressFrames.push({ title: frame.title, steps: frame.steps.map((step) => ({ ...step })) });
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

function finalSteps(host: ReturnType<typeof createFakeHost>) {
  return new Map(host.progressFrames.at(-1)!.steps.map((step) => [step.label, step]));
}

function frameStep(frame: ProgressFrame, label: string) {
  return frame.steps.find((step) => step.label === label)!;
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
    "OMZ plugins",
    "git",
    "stow",
    "npm",
    "pi",
    "herdr",
    "OpenCode",
    "Zed",
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
  const host = createFakeHost(
    ["zsh", "git", "stow", "npm", "bun", "pi", "herdr", "opencode", "zed"],
    {
      homeDir: home,
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        `${home}/.agents/skills`,
        `${home}/.config/mcp/mcp.json`,
        `${home}/.local/bin/dotfiles`,
      ],
      loginShell: "/bin/zsh",
    },
  );
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

test("init clones the Oh My Zsh plugins that are missing", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    packageManager: "apt",
    files: [`${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).toEqual([
    "oh-my-zsh",
    "zsh-syntax-highlighting",
    "nvm",
    "herdr",
    "pi",
    "opencode",
    "zed",
  ]);
  expect(finalSteps(host).get("OMZ plugins")).toEqual({
    label: "OMZ plugins",
    detail: "2 plugins",
    state: "done",
  });
});

test("already-cloned Oh My Zsh plugins are not requested again", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    packageManager: "apt",
    files: [
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
    ],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).not.toContain("zsh-autosuggestions");
  expect(host.upstreamInstalls).not.toContain("zsh-syntax-highlighting");
  expect(finalSteps(host).get("OMZ plugins")).toMatchObject({
    state: "skipped",
    detail: "present",
  });
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
  expect(zshrc).toContain("nvm");
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
  expect(finalSteps(host).get("login shell")).toEqual({
    label: "login shell",
    detail: "zsh",
    state: "done",
  });
});

test("init reports live progress frames for each step", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  const frames = host.progressFrames;
  expect(frames[0].title).toBe("Distro: apt");
  expect(frames[0].steps.every((step) => step.state === "pending")).toBe(true);
  const distroRunning = frames.find(
    (frame) => frameStep(frame, "Distro packages").state === "running",
  );
  expect(distroRunning?.steps[0].detail).toBe("zsh, git, stow");
  const zedRunning = frames.find((frame) => frameStep(frame, "Zed").state === "running");
  expect(zedRunning).toBeDefined();
  expect(frameStep(zedRunning!, "Stow").state).toBe("pending");
  for (const step of frames.at(-1)!.steps) {
    expect(["done", "skipped"]).toContain(step.state);
  }
  const final = finalSteps(host);
  expect(final.get("Distro packages")).toEqual({
    label: "Distro packages",
    detail: "zsh, git, stow",
    state: "done",
  });
  expect(final.get("pi + packages")).toEqual({
    label: "pi + packages",
    detail: "8 packages",
    state: "done",
  });
  expect(final.get("API Keys")).toEqual({ label: "API Keys", detail: "empty", state: "skipped" });
  expect(final.get("Ghostty")).toEqual({
    label: "Ghostty",
    detail: "declined",
    state: "skipped",
  });
  expect(final.get("dotfiles CLI")).toEqual({
    label: "dotfiles CLI",
    detail: "~/.local/bin",
    state: "done",
  });
});

test("when Workflow is already present, frames say skipped with present details", async () => {
  const home = "/fake-home";
  const host = createFakeHost(
    ["zsh", "git", "stow", "npm", "bun", "pi", "herdr", "opencode", "zed"],
    {
      homeDir: home,
      packageManager: "apt",
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        `${home}/.agents/skills`,
        `${home}/.config/mcp/mcp.json`,
        `${home}/.local/bin/dotfiles`,
      ],
      loginShell: "/bin/zsh",
      promptAnswers: ["y", ""],
    },
  );
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  const final = finalSteps(host);
  expect(final.get("Distro packages")).toMatchObject({ state: "skipped", detail: "present" });
  expect(final.get("Oh My Zsh")).toMatchObject({ state: "skipped", detail: "present" });
  expect(final.get("OMZ plugins")).toMatchObject({ state: "skipped", detail: "present" });
  expect(final.get("nvm + Node LTS")).toMatchObject({ state: "skipped", detail: "npm present" });
  expect(final.get("herdr")).toMatchObject({ state: "skipped", detail: "present" });
  expect(final.get("pi + packages")).toMatchObject({ state: "skipped", detail: "present" });
  expect(final.get("OpenCode")).toMatchObject({ state: "skipped", detail: "present" });
  expect(final.get("Zed")).toMatchObject({ state: "skipped", detail: "present" });
  expect(final.get("Skills")).toMatchObject({ state: "skipped", detail: "present" });
  expect(final.get("Stow")).toMatchObject({ state: "done", detail: "linked" });
  expect(final.get("login shell")).toMatchObject({ state: "skipped", detail: "already zsh" });
  expect(final.get("Ghostty")).toMatchObject({ state: "skipped", detail: "declined" });
  const zedNeverRan = host.progressFrames.every(
    (frame) => frameStep(frame, "Zed").state !== "running",
  );
  expect(zedNeverRan).toBe(true);
});

test("after changing the login shell, init shows the hint then offers a reboot; default no", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  const message = host.prompts.find((p) => p.includes("Reboot to apply it?")) ?? "";
  expect(message).toContain("Login shell is now zsh.");
  expect(message).toContain("Run `zsh` or `reboot` to fully apply the change.");
  expect(host.reboots).toBe(0);
});

test("answering yes reboots after the rest of init has finished", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    packageManager: "apt",
    promptAnswers: ["", "", "y"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.reboots).toBe(1);
  expect(host.fileExists(`${home}/.local/bin/dotfiles`)).toBe(true);
  expect(result.stdout).toContain("Rebooting");
});

test("no reboot question when the login shell is already zsh", async () => {
  const home = "/fake-home";
  const host = createFakeHost(
    ["zsh", "git", "stow", "npm", "bun", "pi", "herdr", "opencode", "zed"],
    {
      homeDir: home,
      packageManager: "apt",
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        `${home}/.agents/skills`,
        `${home}/.config/mcp/mcp.json`,
        `${home}/.local/bin/dotfiles`,
      ],
      loginShell: "/bin/zsh",
      promptAnswers: ["y", ""],
    },
  );
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts.some((p) => p.includes("Reboot"))).toBe(false);
  expect(host.reboots).toBe(0);
});

test("a failed reboot warns instead of failing init", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    promptAnswers: ["", "", "y"],
    rebootError: true,
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.reboots).toBe(1);
  expect(result.stderr).toContain("sudo reboot");
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

test("init requests nvm when npm is missing", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).toContain("nvm");
});

test("init does not request nvm when npm is already present", async () => {
  const host = createFakeHost(["bun", "npm"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).not.toContain("nvm");
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

test("APPEND_SYSTEM and prompts are restored; extensions, auth, sessions, caches, and model stores are not", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [
      ".pi/agent/APPEND_SYSTEM.md",
      ".pi/agent/prompts/init.md",
      ".pi/agent/extensions/herdr-agent-state.ts",
      ".pi/agent/extensions/moshi-hooks.ts",
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
  expect(host.linked).not.toContain(".pi/agent/extensions/herdr-agent-state.ts");
  expect(host.linked).not.toContain(".pi/agent/extensions/moshi-hooks.ts");
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
  expect(finalSteps(host).get("API Keys")).toEqual({
    label: "API Keys",
    detail: "merged into /etc/environment",
    state: "done",
  });
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
  expect(finalSteps(host).get("API Keys")).toMatchObject({ state: "skipped", detail: "declined" });
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
  expect(JSON.stringify(host.progressFrames)).not.toContain(secret);
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
  expect(finalSteps(host).get("Ghostty")).toEqual({
    label: "Ghostty",
    detail: "installed",
    state: "done",
  });
  expect(host.progressFrames.some((frame) => frameStep(frame, "Ghostty").state === "running")).toBe(
    true,
  );
  const cfg = await Bun.file(join(import.meta.dir, "../home/.config/ghostty/config")).text();
  expect(cfg).toContain("theme=Vercel");
  expect(cfg).toContain("Geist Mono");
});

test("already-installed Ghostty is not offered again but its config is still Stowed", async () => {
  const host = createFakeHost(["bun", "ghostty"], {
    packageManager: "apt",
    homeTree: [".zshrc", ".config/ghostty/config"],
    promptAnswers: ["", "y"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts.some((p) => p.includes("Install Ghostty?"))).toBe(false);
  expect(host.packagesRequested).toEqual(["zsh", "git", "stow"]);
  expect(host.linked).toContain(".config/ghostty/config");
  expect(finalSteps(host).get("Ghostty")).toEqual({
    label: "Ghostty",
    detail: "present",
    state: "skipped",
  });
});

test("on a re-run, init still offers Ghostty when it is missing", async () => {
  const home = "/fake-home";
  const host = createFakeHost(
    ["zsh", "git", "stow", "npm", "bun", "pi", "herdr", "opencode", "zed"],
    {
      homeDir: home,
      packageManager: "apt",
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        `${home}/.agents/skills`,
        `${home}/.config/mcp/mcp.json`,
        `${home}/.local/bin/dotfiles`,
      ],
      loginShell: "/bin/zsh",
      homeTree: [".zshrc", ".config/ghostty/config"],
      promptAnswers: ["y", "", "y"],
    },
  );
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts.some((p) => p.includes("Install Ghostty?"))).toBe(true);
  expect(host.packagesRequested).toEqual(["ghostty"]);
  expect(host.linked).toContain(".config/ghostty/config");
  expect(finalSteps(host).get("Ghostty")).toEqual({
    label: "Ghostty",
    detail: "installed",
    state: "done",
  });
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
  expect(finalSteps(host).get("Ghostty")).toEqual({
    label: "Ghostty",
    detail: "not in Package Map for zypper",
    state: "failed",
  });
  expect(host.packagesRequested).toEqual(["zsh", "git", "stow"]);
  expect(host.linked).not.toContain(".config/ghostty/config");
  expect(host.loginShell()).toBe("zsh");
});

test("when Workflow already looks present, init asks continue? before doing work", async () => {
  const home = "/fake-home";
  const host = createFakeHost(
    ["zsh", "git", "stow", "npm", "bun", "pi", "herdr", "opencode", "zed"],
    {
      homeDir: home,
      packageManager: "apt",
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        `${home}/.agents/skills`,
        `${home}/.config/mcp/mcp.json`,
        `${home}/.local/bin/dotfiles`,
      ],
      loginShell: "/bin/zsh",
    },
  );
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts[0]?.toLowerCase()).toContain("continue?");
  expect(host.packagesRequested).toEqual([]);
  expect(host.upstreamInstalls).toEqual([]);
});

test("declining continue leaves the Host unchanged", async () => {
  const home = "/fake-home";
  const existing = 'PATH="/usr/bin"\n';
  const host = createFakeHost(
    ["zsh", "git", "stow", "npm", "bun", "pi", "herdr", "opencode", "zed"],
    {
      homeDir: home,
      packageManager: "apt",
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        `${home}/.agents/skills`,
        `${home}/.config/mcp/mcp.json`,
        `${home}/.local/bin/dotfiles`,
      ],
      loginShell: "/bin/zsh",
      homeTree: [".zshrc"],
      environmentFile: existing,
      promptAnswers: ["n"],
    },
  );
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.packagesRequested).toEqual([]);
  expect(host.upstreamInstalls).toEqual([]);
  expect(host.piPackagesRequested).toEqual([]);
  expect(host.skillsRequested).toEqual([]);
  expect(host.linked).toEqual([]);
  expect(host.backups).toEqual([]);
  expect(await host.readEnvironment()).toBe(existing);
  expect(host.loginShell()).toBe("/bin/zsh");
});

test("continue does not re-request tools the Host already has", async () => {
  const home = "/fake-home";
  const host = createFakeHost(
    ["zsh", "git", "stow", "npm", "bun", "pi", "herdr", "opencode", "zed"],
    {
      homeDir: home,
      packageManager: "apt",
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        `${home}/.agents/skills`,
        `${home}/.config/mcp/mcp.json`,
        `${home}/.local/bin/dotfiles`,
      ],
      loginShell: "/bin/zsh",
      promptAnswers: ["y"],
    },
  );
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.packagesRequested).toEqual([]);
  expect(host.upstreamInstalls).toEqual([]);
  expect(host.piPackagesRequested).toEqual([]);
  expect(host.skillsRequested).toEqual([]);
});

test("continue still confirms before /etc/environment writes", async () => {
  const home = "/fake-home";
  const existing = 'PATH="/usr/bin"\n';
  const host = createFakeHost(
    ["zsh", "git", "stow", "npm", "bun", "pi", "herdr", "opencode", "zed"],
    {
      homeDir: home,
      packageManager: "apt",
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        `${home}/.agents/skills`,
        `${home}/.config/mcp/mcp.json`,
        `${home}/.local/bin/dotfiles`,
      ],
      loginShell: "/bin/zsh",
      environmentFile: existing,
      promptAnswers: ["y", "OPENROUTER_API_KEY=sk-secret", "n"],
    },
  );
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts.some((p) => p.includes("/etc/environment"))).toBe(true);
  expect(await host.readEnvironment()).toBe(existing);
});

test("continue still confirms before Stow conflicts", async () => {
  const home = "/fake-home";
  const host = createFakeHost(
    ["zsh", "git", "stow", "npm", "bun", "pi", "herdr", "opencode", "zed"],
    {
      homeDir: home,
      packageManager: "apt",
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        `${home}/.agents/skills`,
        `${home}/.config/mcp/mcp.json`,
        `${home}/.local/bin/dotfiles`,
        `${home}/.zshrc`,
      ],
      loginShell: "/bin/zsh",
      homeTree: [".zshrc"],
      promptAnswers: ["y", "n"],
    },
  );
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts.some((p) => p.toLowerCase().includes("stow"))).toBe(true);
  expect(host.backups).toEqual([]);
  expect(host.linked).not.toContain(".zshrc");
});

test("init requests the OpenCode Upstream Install on the Host", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).toContain("opencode");
});

test("if OpenCode is already present, init does not request it again", async () => {
  const host = createFakeHost(["bun", "opencode"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).not.toContain("opencode");
});

test("a failed OpenCode Upstream Install fails the command", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    upstreamInstallError: "opencode",
  });
  const result = await run(["init"], host);
  expect(result.exitCode).not.toBe(0);
  expect(host.upstreamInstalls).toContain("opencode");
});

test("init requests the Zed Upstream Install on the Host", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).toContain("zed");
});

test("if Zed is already present, init does not request it again", async () => {
  const host = createFakeHost(["bun", "zed"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).not.toContain("zed");
});

test("a failed Zed Upstream Install fails the command", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    upstreamInstallError: "zed",
  });
  const result = await run(["init"], host);
  expect(result.exitCode).not.toBe(0);
  expect(host.upstreamInstalls).toContain("zed");
});

test("Zed settings and keymap are Stowed with extensions declared for auto-install", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".config/zed/settings.json", ".config/zed/keymap.json"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toContain(".config/zed/settings.json");
  expect(host.linked).toContain(".config/zed/keymap.json");
  const settings = await Bun.file(
    join(import.meta.dir, "../home/.config/zed/settings.json"),
  ).json();
  expect(Object.keys(settings.auto_install_extensions)).toHaveLength(18);
  expect(settings.auto_install_extensions).toMatchObject({
    dracula: true,
    "material-icon-theme": true,
    vue: true,
  });
  const keymap = await Bun.file(join(import.meta.dir, "../home/.config/zed/keymap.json")).json();
  expect(JSON.stringify(keymap)).toContain("terminal::SendText");
});

test("doctor reports OpenCode missing as a required failure", async () => {
  const host = createFakeHost();
  const result = await run(["doctor"], host);
  expect(result.exitCode).not.toBe(0);
  expect(result.stdout).toContain("OpenCode: missing");
  expect(result.stdout).not.toContain("OpenCode: missing (optional)");
});

test("doctor reports OpenCode and Zed present without treating them as optional", async () => {
  const home = "/fake-home";
  const host = createFakeHost(
    ["zsh", "git", "stow", "npm", "bun", "pi", "herdr", "opencode", "zed"],
    {
      homeDir: home,
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        `${home}/.agents/skills`,
        `${home}/.config/mcp/mcp.json`,
        `${home}/.local/bin/dotfiles`,
      ],
      loginShell: "/bin/zsh",
    },
  );
  const result = await run(["doctor"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("OpenCode: ok");
  expect(result.stdout).not.toContain("OpenCode: missing (optional)");
  expect(result.stdout).toContain("Zed: ok");
  expect(result.stdout).not.toContain("Zed: missing (optional)");
});

test("OpenCode global config and TUI config are Stowed", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [
      ".config/opencode/opencode.json",
      ".config/opencode/tui.json",
      ".config/opencode/tui.jsonc",
    ],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toContain(".config/opencode/opencode.json");
  expect(host.linked).toContain(".config/opencode/tui.json");
  expect(host.linked).toContain(".config/opencode/tui.jsonc");
  const cfg = await Bun.file(
    join(import.meta.dir, "../home/.config/opencode/opencode.json"),
  ).json();
  expect(cfg.permission).toBe("allow");
  expect(cfg.autoupdate).toBe(true);
  expect(cfg).not.toHaveProperty("mcp");
  expect(cfg).not.toHaveProperty("model");
  expect(cfg).not.toHaveProperty("provider");
  expect(cfg).not.toHaveProperty("defaultModel");
  expect(cfg).not.toHaveProperty("defaultProvider");
  const tui = await Bun.file(join(import.meta.dir, "../home/.config/opencode/tui.json")).json();
  expect(tui.$schema).toBe("https://opencode.ai/tui.json");
  const tuiC = await Bun.file(join(import.meta.dir, "../home/.config/opencode/tui.jsonc")).text();
  expect(tuiC).toContain("./herdr-tui-session.js");
});

test("herdr OpenCode plugin files are Stowed", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [
      ".config/opencode/herdr-tui-session.js",
      ".config/opencode/plugins/herdr-agent-state.js",
    ],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toContain(".config/opencode/herdr-tui-session.js");
  expect(host.linked).toContain(".config/opencode/plugins/herdr-agent-state.js");
  const tuiPlugin = await Bun.file(
    join(import.meta.dir, "../home/.config/opencode/herdr-tui-session.js"),
  ).text();
  expect(tuiPlugin).toContain("HERDR_INTEGRATION_ID=opencode-tui");
  const agentPlugin = await Bun.file(
    join(import.meta.dir, "../home/.config/opencode/plugins/herdr-agent-state.js"),
  ).text();
  expect(agentPlugin).toContain("HERDR_INTEGRATION_ID=opencode");
});

test("OpenCode-local skills, auth, sessions, and node_modules are not Stowed", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [
      ".config/opencode/opencode.json",
      ".config/opencode/skills/android/SKILL.md",
      ".config/opencode/auth.json",
      ".config/opencode/sessions/x.json",
      ".config/opencode/node_modules/foo/index.js",
      ".config/opencode/cache/tools.json",
      ".config/opencode/opencode.db",
    ],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toEqual([".config/opencode/opencode.json"]);
});

test("curated zshrc puts OpenCode bin directory on PATH", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".zshrc"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toContain(".zshrc");
  const zshrc = await Bun.file(join(import.meta.dir, "../home/.zshrc")).text();
  expect(zshrc).toContain("$HOME/.opencode/bin");
});

test("after init, OpenCode mcp key contains the XDG MCP servers", async () => {
  const home = "/fake-home";
  const xdg = await Bun.file(join(import.meta.dir, "../home/.config/mcp/mcp.json")).text();
  const snapshot = await Bun.file(
    join(import.meta.dir, "../home/.config/opencode/opencode.json"),
  ).text();
  const host = createFakeHost(["bun"], {
    homeDir: home,
    packageManager: "apt",
    homeTree: [".config/mcp/mcp.json", ".config/opencode/opencode.json"],
    treeContents: {
      ".config/mcp/mcp.json": xdg,
      ".config/opencode/opencode.json": snapshot,
    },
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  const written = JSON.parse(host.fileContents[`${home}/.config/opencode/opencode.json`] ?? "{}");
  expect(Object.keys(written.mcp).sort()).toEqual([
    "better-auth",
    "bun",
    "mobile-mcp",
    "nuxt",
    "nuxt-ui",
  ]);
  expect(written.mcp.bun).toEqual({ type: "remote", url: "https://bun.com/docs/mcp" });
  expect(written.mcp.nuxt).toEqual({ type: "remote", url: "https://nuxt.com/mcp" });
  expect(written.mcp["nuxt-ui"]).toEqual({ type: "remote", url: "https://ui.nuxt.com/mcp" });
  expect(written.mcp["better-auth"]).toEqual({
    type: "remote",
    url: "https://mcp.better-auth.com/mcp",
  });
  expect(written.mcp["mobile-mcp"]).toEqual({
    type: "local",
    command: ["bunx", "--bun", "@mobilenext/mobile-mcp@latest"],
  });
  expect(written.permission).toBe("allow");
  expect(written.autoupdate).toBe(true);
  const repoSnapshot = await Bun.file(
    join(import.meta.dir, "../home/.config/opencode/opencode.json"),
  ).json();
  expect(repoSnapshot).not.toHaveProperty("mcp");
});

test("re-running init refreshes OpenCode mcp key from the XDG file", async () => {
  const home = "/fake-home";
  const ocPath = `${home}/.config/opencode/opencode.json`;
  const treeContents = {
    ".config/mcp/mcp.json": JSON.stringify({
      mcpServers: {
        bun: { command: "npx", args: ["mcp-remote", "https://bun.com/docs/mcp"] },
      },
    }),
    ".config/opencode/opencode.json": JSON.stringify({ permission: "allow" }),
  };
  const host = createFakeHost(["bun"], {
    homeDir: home,
    packageManager: "apt",
    homeTree: [".config/mcp/mcp.json", ".config/opencode/opencode.json"],
    treeContents,
  });
  await run(["init"], host);
  expect(Object.keys(JSON.parse(host.fileContents[ocPath] ?? "{}").mcp)).toEqual(["bun"]);
  treeContents[".config/mcp/mcp.json"] = JSON.stringify({
    mcpServers: {
      bun: { command: "npx", args: ["mcp-remote", "https://bun.com/docs/mcp"] },
      nuxt: { command: "npx", args: ["mcp-remote", "https://nuxt.com/mcp"] },
    },
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(Object.keys(JSON.parse(host.fileContents[ocPath] ?? "{}").mcp).sort()).toEqual([
    "bun",
    "nuxt",
  ]);
});

test("a Host missing OpenCode is not treated as Workflow already present", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["zsh", "git", "stow", "npm", "bun", "pi", "herdr"], {
    homeDir: home,
    packageManager: "apt",
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      `${home}/.agents/skills`,
      `${home}/.config/mcp/mcp.json`,
      `${home}/.local/bin/dotfiles`,
    ],
    loginShell: "/bin/zsh",
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts[0]?.toLowerCase()).not.toContain("continue?");
  expect(host.upstreamInstalls).toContain("opencode");
});

test("continue does not re-request OpenCode if it is already installed", async () => {
  const home = "/fake-home";
  const host = createFakeHost(
    ["zsh", "git", "stow", "npm", "bun", "pi", "herdr", "opencode", "zed"],
    {
      homeDir: home,
      packageManager: "apt",
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        `${home}/.agents/skills`,
        `${home}/.config/mcp/mcp.json`,
        `${home}/.local/bin/dotfiles`,
      ],
      loginShell: "/bin/zsh",
      promptAnswers: ["y"],
    },
  );
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).not.toContain("opencode");
});

test("continue still confirms before Stow conflicts for OpenCode config", async () => {
  const home = "/fake-home";
  const host = createFakeHost(
    ["zsh", "git", "stow", "npm", "bun", "pi", "herdr", "opencode", "zed"],
    {
      homeDir: home,
      packageManager: "apt",
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        `${home}/.agents/skills`,
        `${home}/.config/mcp/mcp.json`,
        `${home}/.local/bin/dotfiles`,
        `${home}/.config/opencode/opencode.json`,
      ],
      loginShell: "/bin/zsh",
      homeTree: [".config/opencode/opencode.json"],
      promptAnswers: ["y", "n"],
    },
  );
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts.some((p) => p.toLowerCase().includes("stow"))).toBe(true);
  expect(host.backups).toEqual([]);
  expect(host.linked).not.toContain(".config/opencode/opencode.json");
});
