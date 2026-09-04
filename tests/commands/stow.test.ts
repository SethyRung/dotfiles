import { expect, test } from "bun:test";
import { run } from "@/cli.ts";
import { parseDate } from "@/utils/time.ts";
import { createFakeHost } from "../helpers/fake-host.ts";

test("dotfiles stow on a clean fake $HOME links the home/ tree and PATH stub", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".zshrc", ".config/herdr/config.toml"],
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("linked:");
  expect(result.stdout).toContain(`${home}/.zshrc`);
  expect(result.stdout).toContain(`${home}/.config/herdr/config.toml`);
  expect(result.stdout).not.toContain("backed up:");
  expect(result.stdout).not.toContain("skipped:");
  expect(host.linked).toEqual([".zshrc", ".config/herdr/config.toml"]);
  expect(host.backups).toEqual([]);
  expect(host.dotfilesLinks).toBe(1);
  expect(host.fileExists(`${home}/.local/bin/dotfiles`)).toBe(true);
});

test("when a target file already exists, a timestamped backup is created and Stow then links", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".zshrc"],
    files: [`${home}/.zshrc`],
    now: parseDate("2026-01-01_10:30:20"),
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("backed up:");
  expect(result.stdout).toContain(`${home}/.zshrc`);
  expect(result.stdout).toContain("linked:");
  expect(host.backups).toEqual([`${home}/.zshrc.2026-01-01_10:30:20`]);
  expect(host.linked).toEqual([".zshrc"]);
});

test("re-Stowing a dest that already symlinks into the repo creates no backup", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".zshrc", ".config/herdr/config.toml"],
    repoLinks: [`${home}/.zshrc`, `${home}/.config/herdr/config.toml`],
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("skipped:");
  expect(result.stdout).toContain(`${home}/.zshrc`);
  expect(result.stdout).toContain(`${home}/.config/herdr/config.toml`);
  expect(result.stdout).not.toContain("backed up:");
  expect(host.backups).toEqual([]);
  expect(host.linked).toEqual([".zshrc", ".config/herdr/config.toml"]);
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
  expect(result.stdout).not.toContain("session.log");
  expect(result.stdout).not.toContain("herdr.sock");
  expect(host.linked).toEqual([".config/herdr/config.toml"]);
});

test("dotfiles stow relinks the PATH stub even when a dest already exists", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".zshrc", ".config/herdr/config.toml"],
    files: [`${home}/.local/bin/dotfiles`, `${home}/.zshrc`],
    repoLinks: [`${home}/.zshrc`],
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(host.dotfilesLinks).toBe(1);
  expect(host.fileExists(`${home}/.local/bin/dotfiles`)).toBe(true);
  expect(host.linked).toEqual([".zshrc", ".config/herdr/config.toml"]);
  expect(host.backups).toEqual([]);
  expect(host.repoPulls).toBe(0);
  expect(host.upstreamInstalls).toEqual([]);
  expect(host.packagesRequested).toEqual([]);
});

test("dotfiles stow replaces stale dest symlinks without a backup", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".zshrc", ".config/herdr/config.toml"],
    files: [`${home}/.zshrc`, `${home}/.config/herdr/config.toml`],
    staleLinks: [`${home}/.zshrc`, `${home}/.config/herdr/config.toml`],
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("linked:");
  expect(result.stdout).not.toContain("backed up:");
  expect(host.backups).toEqual([]);
  expect(host.linked).toEqual([".zshrc", ".config/herdr/config.toml"]);
  expect(host.dotfilesLinks).toBe(1);
});

test("dotfiles stow --dry-run prints report and writes nothing", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".zshrc", ".config/herdr/config.toml"],
    files: [`${home}/.zshrc`],
    now: parseDate("2026-01-01_10:30:20"),
  });
  const result = await run(["stow", "--dry-run"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("backed up:");
  expect(result.stdout).toContain(`${home}/.zshrc`);
  expect(result.stdout).toContain("linked:");
  expect(result.stdout).toContain(`${home}/.zshrc`);
  expect(result.stdout).toContain(`${home}/.config/herdr/config.toml`);
  expect(host.backups).toEqual([]);
  expect(host.linked).toEqual([]);
  expect(host.dotfilesLinks).toBe(0);
  expect(host.fileExists(`${home}/.config/herdr/config.toml`)).toBe(false);
});

test("dotfiles stow --dry-run with already linked files reports them as skipped", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".zshrc", ".config/herdr/config.toml"],
    repoLinks: [`${home}/.zshrc`],
  });
  const result = await run(["stow", "--dry-run"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("skipped:");
  expect(result.stdout).toContain(`${home}/.zshrc`);
  expect(result.stdout).toContain("linked:");
  expect(result.stdout).toContain(`${home}/.config/herdr/config.toml`);
  expect(host.linked).toEqual([]);
  expect(host.dotfilesLinks).toBe(0);
});

test("dotfiles stow --help documents --dry-run", async () => {
  const host = createFakeHost(["bun"]);
  const result = await run(["stow", "--help"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("--dry-run");
});

test("--dry-run on init, doctor, or clean fails closed", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  for (const cmd of ["init", "doctor", "clean"]) {
    const result = await run([cmd, "--dry-run"], host);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("unknown option: --dry-run");
  }
});

test("real dotfiles stow writes OpenCode mcp from the XDG file after linking", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".config/mcp/mcp.json", ".config/opencode/opencode.json"],
    treeContents: {
      ".config/mcp/mcp.json": JSON.stringify({
        mcpServers: { bun: { command: "bunx", args: ["https://bun.com/mcp"] } },
      }),
      ".config/opencode/opencode.json": JSON.stringify({ permission: "allow" }),
    },
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  const oc = JSON.parse(host.fileContents[`${home}/.config/opencode/opencode.json`] ?? "{}");
  expect(oc.mcp).toBeDefined();
  expect(oc.mcp.bun).toEqual({ type: "remote", url: "https://bun.com/mcp" });
});

test("dotfiles stow --dry-run does not write OpenCode config", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".config/mcp/mcp.json", ".config/opencode/opencode.json"],
    treeContents: {
      ".config/mcp/mcp.json": JSON.stringify({
        mcpServers: { bun: { command: "bunx", args: ["https://bun.com/mcp"] } },
      }),
      ".config/opencode/opencode.json": JSON.stringify({ permission: "allow" }),
    },
  });
  const result = await run(["stow", "--dry-run"], host);
  expect(result.exitCode).toBe(0);
  expect(host.fileContents[`${home}/.config/opencode/opencode.json`]).toBeUndefined();
});

test("missing XDG MCP file skips mirror write and does not invent OpenCode config", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".zshrc"],
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(host.fileExists(`${home}/.config/opencode/opencode.json`)).toBe(false);
});

test("help still has no mcp command and mcp command is rejected as unknown", async () => {
  const host = createFakeHost(["bun"]);
  const helpResult = await run(["--help"], host);
  expect(helpResult.stdout).not.toMatch(/\bmcp\b/);
  const mcpResult = await run(["mcp"], host);
  expect(mcpResult.exitCode).toBe(1);
  expect(mcpResult.stderr).toContain("unknown command: mcp");
});
