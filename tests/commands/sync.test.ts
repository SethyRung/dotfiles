import { expect, test } from "bun:test";
import { run } from "@/cli.ts";
import { parseDate } from "@/utils/time.ts";
import { createFakeHost } from "../helpers/fake-host.ts";

test("dotfiles sync backs up only dests that are not already repo links", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".zshrc", ".config/mcp/mcp.json"],
    repoLinks: [`${home}/.zshrc`],
    files: [`${home}/.config/mcp/mcp.json`],
    now: parseDate("2026-01-01_10:30:20"),
  });
  const result = await run(["sync"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("Config synced");
  expect(host.repoPulls).toBe(1);
  expect(host.backups).toEqual([`${home}/.config/mcp/mcp.json.2026-01-01_10:30:20`]);
  expect(host.linked).toEqual([".zshrc", ".config/mcp/mcp.json"]);
});

test("dotfiles sync pulls the repo, re-Stows, and refreshes the OpenCode MCP mirror", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".zshrc", ".config/mcp/mcp.json"],
    fileContents: {
      [`${home}/.config/mcp/mcp.json`]: JSON.stringify({
        mcpServers: { bun: { command: "bunx", args: ["https://bun.com/mcp"] } },
      }),
    },
    pullRepoOutput: "Fast-forward; new config.",
  });
  const result = await run(["sync"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("Fast-forward; new config.");
  expect(result.stdout).toContain("Stow:");
  expect(result.stdout).toContain("linked:");
  expect(result.stdout).toContain(`${home}/.zshrc`);
  expect(result.stdout).toContain("Config synced");
  expect(host.repoPulls).toBe(1);
  expect(host.linked).toEqual([".zshrc", ".config/mcp/mcp.json"]);
  expect(host.fileContents[`${home}/.config/opencode/opencode.json`]).toContain('"remote"');
  expect(host.upstreamInstalls).toEqual([]);
  expect(host.packagesRequested).toEqual([]);
  expect(host.miseToolsCalls).toBe(0);
});

test("a failed repo pull exits non-zero and Stows nothing", async () => {
  const host = createFakeHost(["bun"], {
    homeTree: [".zshrc"],
    pullRepoError: "divergent branches",
  });
  const result = await run(["sync"], host);
  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain("Repo pull failed");
  expect(result.stderr).toContain("divergent branches");
  expect(result.stdout).toBe("");
  expect(host.repoPulls).toBe(1);
  expect(host.linked).toEqual([]);
});

test("dotfiles sync --dry-run prints Stow report, does not pull, and succeeds on dirty repo", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".zshrc", ".config/mcp/mcp.json"],
    pullRepoError: "divergent branches",
    fileContents: {
      [`${home}/.config/opencode/opencode.json`]: JSON.stringify({ permission: "allow" }),
    },
  });
  const result = await run(["sync", "--dry-run"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("Stow:");
  expect(result.stdout).toContain("linked:");
  expect(result.stdout).toContain(`${home}/.zshrc`);
  expect(result.stdout).not.toContain("Config synced");
  expect(host.repoPulls).toBe(0);
  expect(host.linked).toEqual([]);
  expect(host.backups).toEqual([]);
  const ocConfig = JSON.parse(host.fileContents[`${home}/.config/opencode/opencode.json`] ?? "{}");
  expect(ocConfig).not.toHaveProperty("mcp");
});

test("dotfiles sync --help documents --dry-run", async () => {
  const host = createFakeHost(["bun"]);
  const result = await run(["sync", "--help"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("--dry-run");
});
