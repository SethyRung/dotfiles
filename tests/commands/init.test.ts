import { expect, test } from "bun:test";
import { join } from "node:path";
import { run } from "@/cli.ts";
import { skillsList } from "@/consts/skills-list.ts";
import {
  createFakeHost,
  mcpSource,
  presentWorkflowCommands,
  skillDirs,
} from "../helpers/fake-host.ts";
import { finalSteps, frameStep } from "../helpers/progress.ts";
import { readZshrc } from "../helpers/zshrc.ts";

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
  expect(host.upstreamInstalls).toEqual(["oh-my-zsh", "zsh-syntax-highlighting", "mise", "zed"]);
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

test("init Upstream-Installs mise from mise.run when it is missing", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).toContain("mise");
});

test("init skips the mise Upstream Install when mise is already present", async () => {
  const host = createFakeHost(["bun", "mise"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).not.toContain("mise");
});

test("init Stows the Workflow mise config before requesting Mise Tools", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".zshrc", ".config/mise/config.toml"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toContain(".config/mise/config.toml");
  const stowAt = host.actions.findIndex(
    (action) => action.startsWith("stow:") && action.includes(".config/mise/config.toml"),
  );
  const miseToolsAt = host.actions.indexOf("mise-tools");
  expect(stowAt).toBeGreaterThanOrEqual(0);
  expect(miseToolsAt).toBeGreaterThan(stowAt);
});

test("the committed mise config declares the Workflow Mise Tools with auto_update", async () => {
  const toml = await Bun.file(join(import.meta.dir, "../../home/.config/mise/config.toml")).text();
  expect(toml).toContain('bun = "latest"');
  expect(toml).toContain('codex = "latest"');
  expect(toml).toContain('herdr = "latest"');
  expect(toml).toContain('node = "lts"');
  expect(toml).toContain('opencode = "latest"');
  expect(toml).toContain('pi = "latest"');
  expect(toml).toContain("auto_update = true");
  expect(toml).toContain('gh = "latest"');
  expect(toml).toContain('"npm:@xai-official/grok" = "latest"');
  expect(toml).toContain('agy = "latest"');
});

test("init always requests installMiseTools even when the Mise Tool commands already exist", async () => {
  const host = createFakeHost(["bun", "npm", "node", "herdr", "pi", "opencode"], {
    packageManager: "apt",
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.miseToolsCalls).toBe(1);
});

test("init never requests nvm, bun, herdr, pi, or OpenCode as Upstream Installs", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  for (const tool of ["nvm", "bun", "herdr", "pi", "opencode"]) {
    expect(host.upstreamInstalls).not.toContain(tool);
  }
});

test("pi packages are requested when pi was missing before installMiseTools", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).not.toContain("pi");
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

test("pi packages are skipped when pi was already present before installMiseTools", async () => {
  const host = createFakeHost(["bun", "pi"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.miseToolsCalls).toBe(1);
  expect(host.piPackagesRequested).toEqual([]);
});

test("the Progress Log replaces the nvm, herdr, and OpenCode rows with mise, Mise Tools, and pi packages", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  const final = finalSteps(host);
  const labels = [...final.keys()];
  expect(labels).not.toContain("nvm + Node LTS");
  expect(labels).not.toContain("herdr");
  expect(labels).not.toContain("OpenCode");
  expect(labels).toContain("mise");
  expect(labels).toContain("Stow");
  expect(labels).toContain("Mise Tools");
  expect(labels).toContain("pi packages");
  expect(final.get("mise")).toEqual({ label: "mise", detail: "latest", state: "done" });
  expect(final.get("Mise Tools")).toEqual({
    label: "Mise Tools",
    detail: "agy, bun, codex, gh, grok, herdr, node, opencode, pi",
    state: "done",
  });
  expect(final.get("pi packages")).toEqual({
    label: "pi packages",
    detail: "8 packages",
    state: "done",
  });
});

test("a failed mise Upstream Install fails the command before Stow or Mise Tools", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    upstreamInstallError: "mise",
  });
  const result = await run(["init"], host);
  expect(result.exitCode).not.toBe(0);
  expect(host.upstreamInstalls).toContain("mise");
  expect(host.miseToolsCalls).toBe(0);
  expect(host.linked).toEqual([]);
});

test("a failed installMiseTools fails the command before later steps", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    installMiseToolsError: true,
  });
  const result = await run(["init"], host);
  expect(result.exitCode).not.toBe(0);
  expect(host.miseToolsCalls).toBe(1);
  expect(host.upstreamInstalls).not.toContain("zed");
  expect(host.piPackagesRequested).toEqual([]);
});

test("README documents v2 flags, completions, Grok/Codex snapshot, and Ghostty on zypper", async () => {
  const readme = await Bun.file(join(import.meta.dir, "../../README.md")).text();
  expect(readme).toContain("init --yes");
  expect(readme).toContain("doctor --json");
  expect(readme).toContain("dotfiles --version");
  expect(readme).toContain("zsh completions");
  expect(readme).toContain("Grok config");
  expect(readme).toContain("Codex config");
  expect(readme).toContain("zypper");
  expect(readme).toContain("`ghostty`");
});

test("zsh completions for the five commands are Stowed and fpath is set before Oh My Zsh", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".zshrc", ".zsh/completions/_dotfiles"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toContain(".zshrc");
  expect(host.linked).toContain(".zsh/completions/_dotfiles");
  const zshrc = await readZshrc();
  const fpathAt = zshrc.indexOf('fpath=("$HOME/.zsh/completions" $fpath)');
  const omzAt = zshrc.indexOf('source "$ZSH/oh-my-zsh.sh"');
  expect(fpathAt).toBeGreaterThan(-1);
  expect(fpathAt).toBeLessThan(omzAt);
  const completion = await Bun.file(
    join(import.meta.dir, "../../home/.zsh/completions/_dotfiles"),
  ).text();
  expect(completion).toContain("#compdef dotfiles");
  expect(completion).toContain("init");
  expect(completion).toContain("doctor");
  expect(completion).toContain("stow");
  expect(completion).toContain("clean");
  expect(completion).toContain("sync");
  expect(completion).toContain("--yes");
  expect(completion).toContain("--json");
  expect(completion).toContain("--dry-run");
  expect(completion).toContain("--version");
  expect(completion).not.toContain("completions");
  expect(completion).not.toContain("update");
  expect(completion).not.toContain("repair");
  const initFlags = completion.match(/init\)[\s\S]*?;;/)?.[0] ?? "";
  const doctorFlags = completion.match(/doctor\)[\s\S]*?;;/)?.[0] ?? "";
  const stowFlags = completion.match(/stow\)[\s\S]*?;;/)?.[0] ?? "";
  const cleanFlags = completion.match(/clean\)[\s\S]*?;;/)?.[0] ?? "";
  const syncFlags = completion.match(/sync\)[\s\S]*?;;/)?.[0] ?? "";
  expect(initFlags).toContain("--yes");
  expect(initFlags).not.toContain("--json");
  expect(initFlags).not.toContain("--dry-run");
  expect(initFlags).not.toContain("--version");
  expect(doctorFlags).toContain("--json");
  expect(doctorFlags).not.toContain("--yes");
  expect(stowFlags).toContain("--dry-run");
  expect(stowFlags).not.toContain("--yes");
  expect(cleanFlags).toContain("--yes");
  expect(cleanFlags).not.toContain("--json");
  expect(syncFlags).toContain("--dry-run");
  expect(syncFlags).not.toContain("--json");
});

test("a curated zshrc is Stowed without Android SDK paths or out-of-scope aliases", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".zshrc"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toEqual([".zshrc"]);
  const zshrc = await readZshrc();
  expect(zshrc).toContain('ZSH_THEME="alanpeabody"');
  expect(zshrc).toContain("git");
  expect(zshrc).toContain("docker");
  expect(zshrc).toContain("zsh-autosuggestions");
  expect(zshrc).toContain("zsh-syntax-highlighting");
  expect(zshrc).not.toMatch(/ANDROID/i);
  expect(zshrc).not.toContain("alias op=");
  expect(zshrc).not.toContain("alias csp=");
  expect(zshrc).not.toContain("alias cpsp=");
  expect(zshrc).not.toContain("alias zshconfig=");
});

test("curated zshrc activates mise after Oh My Zsh, with ~/.local/bin already on PATH", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".zshrc"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  const zshrc = await readZshrc();
  const activateAt = zshrc.indexOf('eval "$($HOME/.local/bin/mise activate zsh)"');
  expect(activateAt).toBeGreaterThanOrEqual(0);
  expect(zshrc.indexOf('source "$ZSH/oh-my-zsh.sh"')).toBeLessThan(activateAt);
  expect(zshrc).toContain('export PATH="$HOME/.local/bin:$HOME/.cache/.bun/bin:$PATH"');
  expect(zshrc).not.toContain("/home/");
});

test("curated OMZ plugins drop nvm but keep npm and node", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".zshrc"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  const zshrc = await readZshrc();
  const pluginsStart = zshrc.indexOf("plugins=(");
  const plugins = zshrc.slice(pluginsStart, zshrc.indexOf(")", pluginsStart));
  expect(plugins).toContain("npm");
  expect(plugins).toContain("node");
  expect(plugins).not.toContain("nvm");
  expect(zshrc).not.toContain("nvm");
});

test("init leaves leftover ~/.bun and ~/.nvm directories on disk", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    packageManager: "apt",
    files: [`${home}/.bun`, `${home}/.nvm`],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.fileExists(`${home}/.bun`)).toBe(true);
  expect(host.fileExists(`${home}/.nvm`)).toBe(true);
  expect(host.backups).toEqual([]);
  expect(host.removedFiles).toEqual([]);
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
  expect(frames[0].title).toBe("Distro packages: apt");
  expect(frames[0].steps.every((step) => step.state === "pending")).toBe(true);
  const distroRunning = frames.find(
    (frame) => frameStep(frame, "Distro packages").state === "running",
  );
  expect(distroRunning?.steps[0].detail).toBe("zsh, git, stow");
  const miseToolsRunning = frames.find(
    (frame) => frameStep(frame, "Mise Tools").state === "running",
  );
  expect(miseToolsRunning).toBeDefined();
  expect(frameStep(miseToolsRunning!, "Stow")).toMatchObject({ state: "done", detail: "linked" });
  expect(frameStep(miseToolsRunning!, "pi packages")).toMatchObject({ state: "pending" });
  const zedRunning = frames.find((frame) => frameStep(frame, "Zed").state === "running");
  expect(zedRunning).toBeDefined();
  expect(frameStep(zedRunning!, "Mise Tools")).toMatchObject({ state: "done" });
  for (const step of frames.at(-1)!.steps) {
    expect(["done", "skipped"]).toContain(step.state);
  }
  const final = finalSteps(host);
  expect(final.get("Distro packages")).toEqual({
    label: "Distro packages",
    detail: "zsh, git, stow",
    state: "done",
  });
  expect(final.get("pi packages")).toEqual({
    label: "pi packages",
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
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    packageManager: "apt",
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      ...skillDirs(home),
      `${home}/.pi/agent/mcp.json`,
      `${home}/.local/bin/dotfiles`,
    ],
    loginShell: "/bin/zsh",
    promptAnswers: ["y", ""],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  const final = finalSteps(host);
  expect(final.get("Distro packages")).toMatchObject({ state: "skipped", detail: "present" });
  expect(final.get("Oh My Zsh")).toMatchObject({ state: "skipped", detail: "present" });
  expect(final.get("OMZ plugins")).toMatchObject({ state: "skipped", detail: "present" });
  expect(final.get("mise")).toMatchObject({ state: "skipped", detail: "present" });
  expect(final.get("Mise Tools")).toMatchObject({
    state: "done",
    detail: "agy, bun, codex, gh, grok, herdr, node, opencode, pi",
  });
  expect(final.get("pi packages")).toMatchObject({ state: "skipped", detail: "present" });
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
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    packageManager: "apt",
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      ...skillDirs(home),
      `${home}/.pi/agent/mcp.json`,
      `${home}/.local/bin/dotfiles`,
    ],
    loginShell: "/bin/zsh",
    promptAnswers: ["y", ""],
  });
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
  expect(host.dotfilesLinks).toBe(1);
});

test("init replaces an existing ~/.local/bin/dotfiles dest", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    packageManager: "apt",
    files: [`${home}/.local/bin/dotfiles`],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.dotfilesLinks).toBe(1);
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

test("herdr config.toml is Stowed into the fake $HOME", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".config/herdr/config.toml"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toEqual([".config/herdr/config.toml"]);
  const toml = await Bun.file(join(import.meta.dir, "../../home/.config/herdr/config.toml")).text();
  expect(toml).toContain('prefix = "ctrl+space"');
  expect(toml).toContain("onboarding = false");
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

test("restored pi settings do not include default model or provider", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".pi/agent/settings.json"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toContain(".pi/agent/settings.json");
  const settings = await Bun.file(
    join(import.meta.dir, "../../home/.pi/agent/settings.json"),
  ).json();
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
    join(import.meta.dir, "../../home/.pi/agent/keybindings.json"),
  ).json();
  expect(keybindings["tui.input.newLine"]).toEqual(["alt+enter"]);
  const zentui = await Bun.file(join(import.meta.dir, "../../home/.pi/agent/zentui.json")).json();
  expect(zentui).toHaveProperty("colorSources");
});

test("Skills are requested via skills.sh, not by snapshotting skill files as the install mechanism", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.skillsRequested).toEqual(skillsList);
  expect(host.linked.some((rel) => rel.startsWith(".agents/skills/"))).toBe(false);
});

test("Skills install even when ~/.agents/skills already exists with other skills", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    packageManager: "apt",
    files: [`${home}/.agents/skills/diagnose-crash`, `${home}/.agents/skills/omarchy`],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.skillsRequested).toEqual(skillsList);
  expect(finalSteps(host).get("Skills")).toMatchObject({ state: "done" });
});

test("init requests only the Skills that are missing", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    packageManager: "apt",
    files: skillDirs(home).slice(0, 1),
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.skillsRequested).toEqual(skillsList.slice(1));
});

test("MCP is not Stowed; pi gets a translated copy", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const source = await Bun.file(join(import.meta.dir, "../../src/consts/mcp.json")).json();
  const host = createFakeHost(["bun"], {
    homeDir: home,
    repoDir: repo,
    packageManager: "apt",
    fileContents: mcpSource(repo, source),
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).not.toContain(".config/mcp/mcp.json");
  expect(host.linked).not.toContain(".pi/agent/mcp.json");
  const pi = JSON.parse(host.fileContents[`${home}/.pi/agent/mcp.json`] ?? "{}");
  expect(pi.mcpServers).toHaveProperty("mobile-mcp");
  expect(pi.mcpServers).toHaveProperty("bun");
  expect(pi.mcpServers.bun).toEqual({ url: "https://bun.com/docs/mcp" });
  expect(pi.mcpServers["mobile-mcp"]).toEqual({
    command: "bunx",
    args: ["--bun", "@mobilenext/mobile-mcp@latest"],
  });
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
    promptAnswers: ["OPENROUTER_API_KEY=sk-secret", "1", "n"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts[1]).toContain("/etc/environment");
});

test("accepting merges keys only; other lines in the file remain", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    environmentFile: 'PATH="/usr/bin"\nKEEP=yes\n',
    promptAnswers: ["OPENROUTER_API_KEY=sk-secret", "1", "y"],
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
    promptAnswers: ["OPENROUTER_API_KEY=sk-secret", "1", "n"],
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
    promptAnswers: [`OPENROUTER_API_KEY=${secret}`, "1", "y"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).not.toContain(secret);
  expect(result.stderr).not.toContain(secret);
  expect(host.prompts.join("")).not.toContain(secret);
  expect(JSON.stringify(host.progressFrames)).not.toContain(secret);
});

test("init loads .env from repo root, shows variable names, and merges on acceptance", async () => {
  const repo = "/fake-repo";
  const secret = "super-secret-from-dotenv";
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    repoDir: repo,
    files: [`${repo}/.env`],
    fileContents: {
      [`${repo}/.env`]: `OPENAI_API_KEY=${secret}\nANTHROPIC_API_KEY=anthropic-secret\n`,
    },
    environmentFile: 'PATH="/usr/bin"\n',
    promptAnswers: ["n", "1", "y"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts[0]).toContain("OPENAI_API_KEY, ANTHROPIC_API_KEY");
  expect(host.prompts[0]).not.toContain(secret);
  expect(await host.readEnvironment()).toContain(`OPENAI_API_KEY=${secret}`);
  expect(await host.readEnvironment()).toContain("ANTHROPIC_API_KEY=anthropic-secret");
  expect(finalSteps(host).get("API Keys")).toEqual({
    label: "API Keys",
    detail: "merged into /etc/environment",
    state: "done",
  });
});

test("modifying .env with Append merges additional keys into loaded keys", async () => {
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    repoDir: repo,
    files: [`${repo}/.env`],
    fileContents: {
      [`${repo}/.env`]: "KEY_ONE=val1\n",
    },
    environmentFile: 'PATH="/usr/bin"\n',
    promptAnswers: ["y", "a", "KEY_TWO=val2", "1", "y"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  const env = await host.readEnvironment();
  expect(env).toContain("KEY_ONE=val1");
  expect(env).toContain("KEY_TWO=val2");
});

test("modifying .env with Override replaces loaded keys with new ones", async () => {
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    repoDir: repo,
    files: [`${repo}/.env`],
    fileContents: {
      [`${repo}/.env`]: "OLD_KEY=oldval\n",
    },
    environmentFile: 'PATH="/usr/bin"\n',
    promptAnswers: ["y", "o", "NEW_KEY=newval", "1", "y"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  const env = await host.readEnvironment();
  expect(env).not.toContain("OLD_KEY");
  expect(env).toContain("NEW_KEY=newval");
});

test("store location option 2 writes to ~/.zshenv", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeDir: home,
    promptAnswers: ["FOO_KEY=bar", "2", "y"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(await host.readFile(`${home}/.zshenv`)).toContain("FOO_KEY=bar");
  expect(finalSteps(host).get("API Keys")).toEqual({
    label: "API Keys",
    detail: "merged into ~/.zshenv",
    state: "done",
  });
});

test("store location option 4 prompts for custom path and writes there", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeDir: home,
    promptAnswers: ["CUSTOM_KEY=customval", "4", "~/.custom_env", "y"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(await host.readFile(`${home}/.custom_env`)).toContain("CUSTOM_KEY=customval");
  expect(finalSteps(host).get("API Keys")).toEqual({
    label: "API Keys",
    detail: "merged into ~/.custom_env",
    state: "done",
  });
});

test("API Key values loaded from .env are never leaked in logs, stdout, stderr, or prompts", async () => {
  const repo = "/fake-repo";
  const secret = "ultra-secret-value-never-leak-12345";
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    repoDir: repo,
    files: [`${repo}/.env`],
    fileContents: {
      [`${repo}/.env`]: `SUPER_SECRET=${secret}\n`,
    },
    environmentFile: 'PATH="/usr/bin"\n',
    promptAnswers: ["n", "1", "y"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).not.toContain(secret);
  expect(result.stderr).not.toContain(secret);
  expect(host.prompts.join("\n")).not.toContain(secret);
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
  const cfg = await Bun.file(
    join(import.meta.dir, "../../home/.config/ghostty/config.ghostty"),
  ).text();
  expect(cfg).toContain("font-size = 10");
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
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    packageManager: "apt",
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      ...skillDirs(home),
      `${home}/.pi/agent/mcp.json`,
      `${home}/.local/bin/dotfiles`,
    ],
    loginShell: "/bin/zsh",
    homeTree: [".zshrc", ".config/ghostty/config"],
    promptAnswers: ["y", "", "y"],
  });
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

test("yes on zypper installs Ghostty and Stows its config", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "zypper",
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
  expect(host.loginShell()).toBe("zsh");
});

test("decline on zypper skips Ghostty package and config", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "zypper",
    homeTree: [".zshrc", ".config/ghostty/config"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts.some((p) => p.includes("Install Ghostty?"))).toBe(true);
  expect(host.packagesRequested).toEqual(["zsh", "git", "stow"]);
  expect(host.linked).not.toContain(".config/ghostty/config");
});

test("dangling PATH and MCP dests after a repo move still ask continue?", async () => {
  const home = "/fake-home";
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    packageManager: "apt",
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      ...skillDirs(home),
    ],
    loginShell: "/bin/zsh",
    brokenStowLinks: [`${home}/.config/herdr/config.toml`, `${home}/.zshrc`],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts[0]?.toLowerCase()).toContain("continue?");
  expect(host.packagesRequested).toEqual([]);
  expect(host.upstreamInstalls).toEqual([]);
  expect(host.linked).toEqual([]);
});

test("when Workflow already looks present, init asks continue? before doing work", async () => {
  const home = "/fake-home";
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    packageManager: "apt",
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      ...skillDirs(home),
      `${home}/.pi/agent/mcp.json`,
      `${home}/.local/bin/dotfiles`,
    ],
    loginShell: "/bin/zsh",
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts[0]?.toLowerCase()).toContain("continue?");
  expect(host.packagesRequested).toEqual([]);
  expect(host.upstreamInstalls).toEqual([]);
});

test("declining continue leaves the Host unchanged", async () => {
  const home = "/fake-home";
  const existing = 'PATH="/usr/bin"\n';
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    packageManager: "apt",
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      ...skillDirs(home),
      `${home}/.pi/agent/mcp.json`,
      `${home}/.local/bin/dotfiles`,
    ],
    loginShell: "/bin/zsh",
    homeTree: [".zshrc"],
    environmentFile: existing,
    promptAnswers: ["n"],
  });
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
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    packageManager: "apt",
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      ...skillDirs(home),
      `${home}/.pi/agent/mcp.json`,
      `${home}/.local/bin/dotfiles`,
    ],
    loginShell: "/bin/zsh",
    promptAnswers: ["y"],
  });
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
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    packageManager: "apt",
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      ...skillDirs(home),
      `${home}/.pi/agent/mcp.json`,
      `${home}/.local/bin/dotfiles`,
    ],
    loginShell: "/bin/zsh",
    environmentFile: existing,
    promptAnswers: ["y", "OPENROUTER_API_KEY=sk-secret", "1", "n"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts.some((p) => p.includes("/etc/environment"))).toBe(true);
  expect(await host.readEnvironment()).toBe(existing);
});

test("continue still confirms before Stow conflicts", async () => {
  const home = "/fake-home";
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    packageManager: "apt",
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      ...skillDirs(home),
      `${home}/.pi/agent/mcp.json`,
      `${home}/.local/bin/dotfiles`,
      `${home}/.zshrc`,
    ],
    loginShell: "/bin/zsh",
    homeTree: [".zshrc"],
    promptAnswers: ["y", "n"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts.some((p) => p.toLowerCase().includes("stow"))).toBe(true);
  expect(host.backups).toEqual([]);
  expect(host.linked).not.toContain(".zshrc");
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
    join(import.meta.dir, "../../home/.config/zed/settings.json"),
  ).json();
  expect(Object.keys(settings.auto_install_extensions)).toHaveLength(18);
  expect(settings.auto_install_extensions).toMatchObject({
    dracula: true,
    "material-icon-theme": true,
    vue: true,
  });
  const keymap = await Bun.file(join(import.meta.dir, "../../home/.config/zed/keymap.json")).json();
  expect(JSON.stringify(keymap)).toContain("editor::DuplicateLineUp");
});

test("Codex config and herdr hooks are Stowed", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".codex/config.toml", ".codex/hooks.json", ".codex/herdr-agent-state.sh"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toContain(".codex/config.toml");
  expect(host.linked).toContain(".codex/hooks.json");
  expect(host.linked).toContain(".codex/herdr-agent-state.sh");
  const cfg = await Bun.file(join(import.meta.dir, "../../home/.codex/config.toml")).text();
  expect(cfg).toContain("hooks = true");
  expect(cfg).not.toContain("[models]");
  const hooks = await Bun.file(join(import.meta.dir, "../../home/.codex/hooks.json")).text();
  expect(hooks).toContain("herdr-agent-state.sh");
  expect(hooks).not.toContain("/home/sethyrung/");
  const herdr = await Bun.file(
    join(import.meta.dir, "../../home/.codex/herdr-agent-state.sh"),
  ).text();
  expect(herdr).toContain("HERDR_INTEGRATION_ID=codex");
});

test("Grok and Codex secrets, sessions, sqlite, and local skills are not Stowed", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [
      ".grok/config.toml",
      ".grok/auth.json",
      ".grok/sessions/x.json",
      ".grok/logs/unified.jsonl",
      ".grok/bin/grok-1.0.25",
      ".grok/models_cache.json",
      ".grok/auth.json.lock",
      ".grok/agent_id",
      ".grok/trusted_folders.toml",
      ".codex/config.toml",
      ".codex/hooks.json",
      ".codex/herdr-agent-state.sh",
      ".codex/state_5.sqlite",
      ".codex/installation_id",
      ".codex/skills/.system/SKILL.md",
      ".codex/tmp/arg0/x",
    ],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toEqual([
    ".grok/config.toml",
    ".codex/config.toml",
    ".codex/hooks.json",
    ".codex/herdr-agent-state.sh",
  ]);
});

test("gh and agy have no Stowed config in the home tree", async () => {
  expect(await Bun.file(join(import.meta.dir, "../../home/.config/gh/config.yml")).exists()).toBe(
    false,
  );
  expect(await Bun.file(join(import.meta.dir, "../../home/.agy")).exists()).toBe(false);
});

test("Grok config is Stowed without privacy banner or default model", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".grok/config.toml"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toContain(".grok/config.toml");
  const cfg = await Bun.file(join(import.meta.dir, "../../home/.grok/config.toml")).text();
  expect(cfg).toContain('theme = "groknight"');
  expect(cfg).toContain('permission_mode = "always-approve"');
  expect(cfg).toContain('installer = "npm"');
  expect(cfg).toContain("xAI Official");
  expect(cfg).not.toContain("privacy_banner_acked");
  expect(cfg).not.toContain("fork_secondary_model");
  expect(cfg).not.toContain("[models]");
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
    join(import.meta.dir, "../../home/.config/opencode/opencode.json"),
  ).json();
  expect(cfg.permission).toBe("allow");
  expect(cfg.autoupdate).toBe(true);
  expect(cfg).not.toHaveProperty("mcp");
  expect(cfg).not.toHaveProperty("model");
  expect(cfg).not.toHaveProperty("provider");
  expect(cfg).not.toHaveProperty("defaultModel");
  expect(cfg).not.toHaveProperty("defaultProvider");
  const tui = await Bun.file(join(import.meta.dir, "../../home/.config/opencode/tui.json")).json();
  expect(tui.$schema).toBe("https://opencode.ai/tui.json");
  const tuiC = await Bun.file(
    join(import.meta.dir, "../../home/.config/opencode/tui.jsonc"),
  ).text();
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
    join(import.meta.dir, "../../home/.config/opencode/herdr-tui-session.js"),
  ).text();
  expect(tuiPlugin).toContain("HERDR_INTEGRATION_ID=opencode-tui");
  const agentPlugin = await Bun.file(
    join(import.meta.dir, "../../home/.config/opencode/plugins/herdr-agent-state.js"),
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

test("curated zshrc hands tool PATH to mise, keeping only ~/.local/bin", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    homeTree: [".zshrc"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toContain(".zshrc");
  const zshrc = await readZshrc();
  expect(zshrc).toContain('export PATH="$HOME/.local/bin:$HOME/.cache/.bun/bin:$PATH"');
  expect(zshrc).not.toContain("BUN_INSTALL");
  expect(zshrc).not.toContain("$HOME/.bun");
  expect(zshrc).not.toContain("HERDR_INSTALL_DIR");
  expect(zshrc).not.toContain("$HOME/.opencode/bin");
});

test("after init, Grok and Codex MCP views contain the repo MCP servers", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const source = await Bun.file(join(import.meta.dir, "../../src/consts/mcp.json")).json();
  const grokSnapshot = await Bun.file(join(import.meta.dir, "../../home/.grok/config.toml")).text();
  const codexSnapshot = await Bun.file(
    join(import.meta.dir, "../../home/.codex/config.toml"),
  ).text();
  const host = createFakeHost(["bun"], {
    homeDir: home,
    repoDir: repo,
    packageManager: "apt",
    homeTree: [".grok/config.toml", ".codex/config.toml"],
    treeContents: {
      ".grok/config.toml": grokSnapshot,
      ".codex/config.toml": codexSnapshot,
    },
    fileContents: mcpSource(repo, source),
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  const grok = Bun.TOML.parse(host.fileContents[`${home}/.grok/config.toml`] ?? "") as {
    mcp_servers: Record<string, { url?: string; command?: string; args?: string[] }>;
    ui: { theme: string };
  };
  expect(Object.keys(grok.mcp_servers).sort()).toEqual([
    "better-auth",
    "bun",
    "mobile-mcp",
    "nuxt",
    "nuxt-ui",
  ]);
  expect(grok.mcp_servers.bun).toEqual({ url: "https://bun.com/docs/mcp" });
  expect(grok.mcp_servers["mobile-mcp"]).toEqual({
    command: "bunx",
    args: ["--bun", "@mobilenext/mobile-mcp@latest"],
  });
  expect(grok.ui.theme).toBe("groknight");
  const codex = Bun.TOML.parse(host.fileContents[`${home}/.codex/config.toml`] ?? "") as {
    mcp_servers: Record<string, { url?: string; command?: string; args?: string[] }>;
    features: { hooks: boolean };
  };
  expect(Object.keys(codex.mcp_servers).sort()).toEqual([
    "better-auth",
    "bun",
    "mobile-mcp",
    "nuxt",
    "nuxt-ui",
  ]);
  expect(codex.mcp_servers.bun).toEqual({ url: "https://bun.com/docs/mcp" });
  expect(codex.features.hooks).toBe(true);
  const repoGrok = await Bun.file(join(import.meta.dir, "../../home/.grok/config.toml")).text();
  expect(repoGrok).not.toContain("[mcp_servers");
});

test("after init, OpenCode mcp key contains the repo MCP servers", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const source = await Bun.file(join(import.meta.dir, "../../src/consts/mcp.json")).json();
  const snapshot = await Bun.file(
    join(import.meta.dir, "../../home/.config/opencode/opencode.json"),
  ).text();
  const host = createFakeHost(["bun"], {
    homeDir: home,
    repoDir: repo,
    packageManager: "apt",
    homeTree: [".config/opencode/opencode.json"],
    treeContents: {
      ".config/opencode/opencode.json": snapshot,
    },
    fileContents: mcpSource(repo, source),
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
    join(import.meta.dir, "../../home/.config/opencode/opencode.json"),
  ).json();
  expect(repoSnapshot).not.toHaveProperty("mcp");
});

test("re-running init refreshes agent MCP from the repo list", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const ocPath = `${home}/.config/opencode/opencode.json`;
  const sourcePath = `${repo}/src/consts/mcp.json`;
  const host = createFakeHost(["bun"], {
    homeDir: home,
    repoDir: repo,
    packageManager: "apt",
    homeTree: [".config/opencode/opencode.json"],
    treeContents: {
      ".config/opencode/opencode.json": JSON.stringify({ permission: "allow" }),
    },
    fileContents: mcpSource(repo, { bun: { url: "https://bun.com/docs/mcp" } }),
  });
  await run(["init"], host);
  expect(Object.keys(JSON.parse(host.fileContents[ocPath] ?? "{}").mcp)).toEqual(["bun"]);
  host.fileContents[sourcePath] = JSON.stringify({
    bun: { url: "https://bun.com/docs/mcp" },
    nuxt: { url: "https://nuxt.com/mcp" },
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(Object.keys(JSON.parse(host.fileContents[ocPath] ?? "{}").mcp).sort()).toEqual([
    "bun",
    "nuxt",
  ]);
  const pi = JSON.parse(host.fileContents[`${home}/.pi/agent/mcp.json`] ?? "{}");
  expect(Object.keys(pi.mcpServers).sort()).toEqual(["bun", "nuxt"]);
});

test("init MCP Progress Log names pi, OpenCode, Grok, and Codex", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(finalSteps(host).get("MCP")).toEqual({
    label: "MCP",
    detail: "pi, OpenCode, Grok, Codex",
    state: "done",
  });
});

test("a Host missing mise is not treated as Workflow already present", async () => {
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
        ...skillDirs(home),
        `${home}/.pi/agent/mcp.json`,
        `${home}/.local/bin/dotfiles`,
      ],
      loginShell: "/bin/zsh",
    },
  );
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts[0]?.toLowerCase()).not.toContain("continue?");
  expect(host.upstreamInstalls).toContain("mise");
});

test("a Host missing Grok is not treated as Workflow already present", async () => {
  const home = "/fake-home";
  const host = createFakeHost(
    presentWorkflowCommands.filter((command) => command !== "grok"),
    {
      homeDir: home,
      packageManager: "apt",
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        ...skillDirs(home),
        `${home}/.pi/agent/mcp.json`,
        `${home}/.local/bin/dotfiles`,
      ],
      loginShell: "/bin/zsh",
    },
  );
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts[0]?.toLowerCase()).not.toContain("continue?");
  expect(host.miseToolsCalls).toBe(1);
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
      `${home}/.pi/agent/mcp.json`,
      `${home}/.local/bin/dotfiles`,
    ],
    loginShell: "/bin/zsh",
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts[0]?.toLowerCase()).not.toContain("continue?");
  expect(host.upstreamInstalls).toContain("mise");
  expect(host.upstreamInstalls).toContain("zed");
  expect(host.upstreamInstalls).not.toContain("opencode");
  expect(host.miseToolsCalls).toBe(1);
});

test("continue still confirms before Stow conflicts for OpenCode config", async () => {
  const home = "/fake-home";
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    packageManager: "apt",
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      ...skillDirs(home),
      `${home}/.pi/agent/mcp.json`,
      `${home}/.local/bin/dotfiles`,
      `${home}/.config/opencode/opencode.json`,
    ],
    loginShell: "/bin/zsh",
    homeTree: [".config/opencode/opencode.json"],
    promptAnswers: ["y", "n"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts.some((p) => p.toLowerCase().includes("stow"))).toBe(true);
  expect(host.backups).toEqual([]);
  expect(host.linked).not.toContain(".config/opencode/opencode.json");
});

test("init uses preset skills from dotfiles.json to override default skills", async () => {
  const repo = "/fake-repo";
  const customSkills = ["custom-owner/custom-repo@my-skill"];
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: JSON.stringify({ skills: customSkills }),
    },
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.skillsRequested).toEqual(customSkills);
  expect(finalSteps(host).get("Skills")).toMatchObject({
    state: "done",
    detail: "1 skills",
  });
});

test("init uses preset pi packages from dotfiles.json to override default pi packages", async () => {
  const repo = "/fake-repo";
  const customPiPackages = ["npm:custom-pi-ext"];
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: JSON.stringify({ piPackages: customPiPackages }),
    },
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.piPackagesRequested).toEqual(customPiPackages);
  expect(finalSteps(host).get("pi packages")).toMatchObject({
    state: "done",
    detail: "1 packages",
  });
});

test("init uses preset omz plugins from dotfiles.json to override default omz plugins", async () => {
  const repo = "/fake-repo";
  const customPlugins = ["custom-plugin"];
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: JSON.stringify({ omzPlugins: customPlugins }),
    },
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).toContain("custom-plugin");
  expect(host.upstreamInstalls).not.toContain("zsh-autosuggestions");
  expect(finalSteps(host).get("OMZ plugins")).toMatchObject({
    state: "done",
    detail: "1 plugins",
  });
});

test("init uses preset distro packages from dotfiles.json to override default packages", async () => {
  const repo = "/fake-repo";
  const customPkgs = ["zsh", "git", "stow", "htop"];
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: JSON.stringify({ packages: customPkgs }),
    },
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.packagesRequested).toEqual(customPkgs);
});

test("invalid dotfiles.json causes init to fail with error before doing work", async () => {
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: "not valid json {",
    },
  });
  const result = await run(["init"], host);
  expect(result.exitCode).not.toBe(0);
  expect(result.stderr).toContain("Failed to parse dotfiles.json");
  expect(host.packagesRequested).toEqual([]);
});

test("init skips ghostty prompt and installation when tools.ghostty is false", async () => {
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: JSON.stringify({ tools: { ghostty: false } }),
    },
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts.some((p) => p.includes("Install Ghostty?"))).toBe(false);
  expect(host.packagesRequested).not.toContain("ghostty");
  expect(finalSteps(host).get("Ghostty")).toMatchObject({
    state: "skipped",
    detail: "disabled in preset",
  });
});

test("init skips ghostty prompt and installs when tools.ghostty is true", async () => {
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: JSON.stringify({ tools: { ghostty: true } }),
    },
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts.some((p) => p.includes("Install Ghostty?"))).toBe(false);
  expect(host.packagesRequested).toContain("ghostty");
  expect(finalSteps(host).get("Ghostty")).toMatchObject({
    state: "done",
    detail: "installed",
  });
});

test("init skips zed installation when tools.zed is false", async () => {
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: JSON.stringify({ tools: { zed: false } }),
    },
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.upstreamInstalls).not.toContain("zed");
  expect(finalSteps(host).get("Zed")).toMatchObject({
    state: "skipped",
    detail: "disabled in preset",
  });
});

test("init --yes issues no prompts and skips Ghostty", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init", "--yes"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts).toEqual([]);
  expect(host.packagesRequested).toEqual(["zsh", "git", "stow"]);
  expect(host.packagesRequested).not.toContain("ghostty");
  expect(host.reboots).toBe(0);
  expect(finalSteps(host).get("Ghostty")).toMatchObject({
    state: "skipped",
    detail: "declined",
  });
});

test("init --yes continues a present Workflow, uses .env as-is, and overwrites Stow conflicts", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    repoDir: repo,
    packageManager: "apt",
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      ...skillDirs(home),
      `${home}/.pi/agent/mcp.json`,
      `${home}/.local/bin/dotfiles`,
      `${home}/.zshrc`,
      `${repo}/.env`,
    ],
    fileContents: {
      [`${repo}/.env`]: "OPENROUTER_API_KEY=sk-secret-do-not-leak\n",
    },
    loginShell: "/bin/zsh",
    homeTree: [".zshrc"],
  });
  const result = await run(["init", "--yes"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts).toEqual([]);
  expect(host.linked).toContain(".zshrc");
  expect(host.backups.length).toBe(1);
  expect(await host.readEnvironment()).toContain("OPENROUTER_API_KEY=sk-secret-do-not-leak");
  expect(result.stdout).not.toContain("sk-secret-do-not-leak");
  expect(result.stderr).not.toContain("sk-secret-do-not-leak");
});

test("init --yes still fail-fasts on an unknown Distro", async () => {
  const host = createFakeHost(["bun"]);
  const result = await run(["init", "--yes"], host);
  expect(result.exitCode).not.toBe(0);
  expect(host.packagesRequested).toEqual([]);
  expect(host.upstreamInstalls).toEqual([]);
  expect(host.prompts).toEqual([]);
  expect(result.stderr).toContain("zypper");
});

test("init --yes still honors Preset Ghostty and Zed toggles", async () => {
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: JSON.stringify({ tools: { ghostty: true, zed: false } }),
    },
  });
  const result = await run(["init", "--yes"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts).toEqual([]);
  expect(host.packagesRequested).toContain("ghostty");
  expect(host.upstreamInstalls).not.toContain("zed");
  expect(finalSteps(host).get("Zed")).toMatchObject({
    state: "skipped",
    detail: "disabled in preset",
  });
});

test("init -y is unknown and does no work", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init", "-y"], host);
  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain("unknown option: -y");
  expect(host.packagesRequested).toEqual([]);
  expect(host.prompts).toEqual([]);
});

test("init --yes --help prints init help and does no work", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  const result = await run(["init", "--yes", "--help"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("Usage: dotfiles init");
  expect(result.stdout).toContain("--yes");
  expect(host.packagesRequested).toEqual([]);
  expect(host.prompts).toEqual([]);
});

test("init asks questions upfront before running installation progress", async () => {
  const host = createFakeHost(["bun"], {
    packageManager: "apt",
    promptAnswers: ["TEST_KEY=123", "1", "y", "y"],
  });
  const result = await run(["init"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts[0]).toContain("key=value");
  expect(host.prompts[1]).toContain("/etc/environment");
  expect(host.prompts[2]).toContain("Write API Keys to /etc/environment?");
  expect(host.prompts[3]).toContain("Install Ghostty?");
  expect(host.packagesRequested).toContain("ghostty");
  expect(await host.readEnvironment()).toContain("TEST_KEY=123");
});
