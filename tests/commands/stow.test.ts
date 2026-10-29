import { expect, test } from "bun:test";
import { run } from "@/cli.ts";
import { parseDate } from "@/utils/time.ts";
import { createFakeHost, mcpSource } from "../helpers/fake-host.ts";

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

test("herdr and orca generated agent files are not linked", async () => {
  const host = createFakeHost(["bun"], {
    homeTree: [
      ".codex/config.toml",
      ".codex/hooks.json",
      ".codex/herdr-agent-state.sh",
      ".config/opencode/opencode.json",
      ".config/opencode/herdr-tui-session.js",
      ".config/opencode/plugins/herdr-agent-state.js",
      ".config/opencode/tui.json",
      ".config/opencode/tui.jsonc",
    ],
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).toEqual([".codex/config.toml", ".config/opencode/opencode.json"]);
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

test("--dry-run on doctor or clean fails closed", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  for (const cmd of ["doctor", "clean"]) {
    const result = await run([cmd, "--dry-run"], host);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("unknown option: --dry-run");
  }
});

test("real dotfiles stow writes pi and OpenCode MCP from the repo list after linking", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    repoDir: repo,
    homeTree: [
      ".config/opencode/opencode.json",
      ".pi/agent/mcp.json",
      ".cursor/mcp.json",
      ".grok/config.toml",
      ".codex/config.toml",
    ],
    treeContents: {
      ".config/opencode/opencode.json": JSON.stringify({ permission: "allow" }),
      ".pi/agent/mcp.json": "{}\n",
      ".cursor/mcp.json": "{}\n",
      ".grok/config.toml": 'theme = "groknight"\n',
      ".codex/config.toml": "[features]\nhooks = true\n",
    },
    fileContents: mcpSource(repo, { bun: { url: "https://bun.com/mcp" } }),
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(host.linked).not.toContain(".config/mcp/mcp.json");
  expect(host.linked).toContain(".pi/agent/mcp.json");
  const oc = JSON.parse(host.fileContents[`${home}/.config/opencode/opencode.json`] ?? "{}");
  expect(oc.mcp).toBeDefined();
  expect(oc.mcp.bun).toEqual({ type: "remote", url: "https://bun.com/mcp" });
  const pi = JSON.parse(host.fileContents[`${home}/.pi/agent/mcp.json`] ?? "{}");
  expect(pi.mcpServers.bun).toEqual({ url: "https://bun.com/mcp" });
  const cursor = JSON.parse(host.fileContents[`${home}/.cursor/mcp.json`] ?? "{}");
  expect(cursor.mcpServers).toEqual({ bun: { url: "https://bun.com/mcp" } });
  const grok = Bun.TOML.parse(host.fileContents[`${home}/.grok/config.toml`] ?? "") as {
    mcp_servers: { bun: { url: string } };
  };
  expect(grok.mcp_servers.bun).toEqual({ url: "https://bun.com/mcp" });
  const codex = Bun.TOML.parse(host.fileContents[`${home}/.codex/config.toml`] ?? "") as {
    mcp_servers: { bun: { url: string } };
    features: { hooks: boolean };
  };
  expect(codex.mcp_servers.bun).toEqual({ url: "https://bun.com/mcp" });
  expect(codex.features.hooks).toBe(true);
});

test("stow overlays curated agent config and keeps machine state", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const codexTemplate = [
    'model = "gpt-6.1-sol"',
    'model_reasoning_effort = "high"',
    "",
    "[features]",
    "hooks = true",
    "",
    "[tui]",
    'theme = "catppuccin-mocha"',
    "",
  ].join("\n");
  const grokTemplate = '[ui]\ntheme = "groknight"\n';
  const openCodeTemplate = JSON.stringify({ permission: "allow", autoupdate: true });
  const host = createFakeHost(["bun"], {
    homeDir: home,
    repoDir: repo,
    homeTree: [".codex/config.toml", ".grok/config.toml", ".config/opencode/opencode.json"],
    treeContents: {
      ".codex/config.toml": codexTemplate,
      ".grok/config.toml": grokTemplate,
      ".config/opencode/opencode.json": openCodeTemplate,
    },
    files: [
      `${home}/.codex/config.toml`,
      `${home}/.grok/config.toml`,
      `${home}/.config/opencode/opencode.json`,
    ],
    fileContents: {
      [`${repo}/home/.codex/config.toml`]: codexTemplate,
      [`${repo}/home/.grok/config.toml`]: grokTemplate,
      [`${repo}/home/.config/opencode/opencode.json`]: openCodeTemplate,
      [`${home}/.codex/config.toml`]: [
        'model = "old"',
        "",
        "[features]",
        "hooks = false",
        "",
        "[tui]",
        "animations = false",
        'theme = "dracula"',
        "",
        '[hooks.state."/tmp/hooks.json:stop:0:0"]',
        'trusted_hash = "sha256:abc"',
        "",
        '[projects."/tmp/proj"]',
        'trust_level = "trusted"',
        "",
      ].join("\n"),
      [`${home}/.grok/config.toml`]: '[ui]\ntheme = "old"\ncompact_mode = true\n',
      [`${home}/.config/opencode/opencode.json`]: JSON.stringify({
        permission: "ask",
        plugin: ["custom"],
      }),
      ...mcpSource(repo, { bun: { url: "https://bun.com/mcp" } }),
    },
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(host.backups).toEqual([]);
  expect(host.fileContents[`${repo}/home/.codex/config.toml`]).toBe(codexTemplate);
  const codex = Bun.TOML.parse(host.fileContents[`${home}/.codex/config.toml`] ?? "") as {
    model: string;
    model_reasoning_effort: string;
    features: { hooks: boolean };
    tui: { animations: boolean; theme: string };
    hooks: { state: Record<string, { trusted_hash: string }> };
    projects: Record<string, { trust_level: string }>;
    mcp_servers: { bun: { url: string } };
  };
  expect(codex.model).toBe("gpt-6.1-sol");
  expect(codex.model_reasoning_effort).toBe("high");
  expect(codex.features.hooks).toBe(true);
  expect(codex.tui).toEqual({ animations: false, theme: "catppuccin-mocha" });
  expect(codex.hooks.state["/tmp/hooks.json:stop:0:0"]?.trusted_hash).toBe("sha256:abc");
  expect(codex.projects["/tmp/proj"]?.trust_level).toBe("trusted");
  expect(codex.mcp_servers.bun).toEqual({ url: "https://bun.com/mcp" });
  const grok = Bun.TOML.parse(host.fileContents[`${home}/.grok/config.toml`] ?? "") as {
    ui: { theme: string; compact_mode: boolean };
    mcp_servers: { bun: { url: string } };
  };
  expect(grok.ui).toEqual({ theme: "groknight", compact_mode: true });
  expect(grok.mcp_servers.bun).toEqual({ url: "https://bun.com/mcp" });
  const oc = JSON.parse(host.fileContents[`${home}/.config/opencode/opencode.json`] ?? "{}");
  expect(oc.permission).toBe("allow");
  expect(oc.autoupdate).toBe(true);
  expect(oc.plugin).toEqual(["custom"]);
  expect(oc.mcp.bun).toEqual({ type: "remote", url: "https://bun.com/mcp" });
});

test("stow overlays Cursor and Antigravity settings and keeps machine state", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const cursorTemplate = JSON.stringify({ "workbench.colorTheme": "Omarchy" });
  const agyTemplate = JSON.stringify({ model: "Gemini 3.8 Flash (High)" });
  const agyConfigTemplate = JSON.stringify({
    userSettings: { permissionPreset: "AGENT_PERMISSION_PRESET_TURBO" },
  });
  const host = createFakeHost(["bun"], {
    homeDir: home,
    repoDir: repo,
    homeTree: [
      ".config/Cursor/User/settings.json",
      ".gemini/antigravity-cli/settings.json",
      ".gemini/config/config.json",
    ],
    treeContents: {
      ".config/Cursor/User/settings.json": cursorTemplate,
      ".gemini/antigravity-cli/settings.json": agyTemplate,
      ".gemini/config/config.json": agyConfigTemplate,
    },
    files: [
      `${home}/.config/Cursor/User/settings.json`,
      `${home}/.gemini/antigravity-cli/settings.json`,
      `${home}/.gemini/config/config.json`,
    ],
    fileContents: {
      [`${repo}/home/.config/Cursor/User/settings.json`]: cursorTemplate,
      [`${repo}/home/.gemini/antigravity-cli/settings.json`]: agyTemplate,
      [`${repo}/home/.gemini/config/config.json`]: agyConfigTemplate,
      [`${home}/.config/Cursor/User/settings.json`]: JSON.stringify({
        "workbench.colorTheme": "Default Dark+",
        "editor.fontSize": 16,
      }),
      [`${home}/.gemini/antigravity-cli/settings.json`]: JSON.stringify({
        model: "old",
        trustedWorkspaces: ["/tmp/proj"],
      }),
      [`${home}/.gemini/config/config.json`]: JSON.stringify({
        userSettings: {
          permissionPreset: "AGENT_PERMISSION_PRESET_DEFAULT",
          remoteControlHostname: "this-machine",
        },
      }),
      ...mcpSource(repo, { bun: { url: "https://bun.com/mcp" } }),
    },
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(host.backups).toEqual([]);
  expect(host.fileContents[`${repo}/home/.gemini/antigravity-cli/settings.json`]).toBe(agyTemplate);
  const cursor = JSON.parse(host.fileContents[`${home}/.config/Cursor/User/settings.json`] ?? "{}");
  expect(cursor["workbench.colorTheme"]).toBe("Omarchy");
  expect(cursor["editor.fontSize"]).toBe(16);
  const agy = JSON.parse(
    host.fileContents[`${home}/.gemini/antigravity-cli/settings.json`] ?? "{}",
  );
  expect(agy.model).toBe("Gemini 3.8 Flash (High)");
  expect(agy.trustedWorkspaces).toEqual(["/tmp/proj"]);
  const agyConfig = JSON.parse(host.fileContents[`${home}/.gemini/config/config.json`] ?? "{}");
  expect(agyConfig.userSettings.permissionPreset).toBe("AGENT_PERMISSION_PRESET_TURBO");
  expect(agyConfig.userSettings.remoteControlHostname).toBe("this-machine");
  const mcp = JSON.parse(host.fileContents[`${home}/.gemini/config/mcp_config.json`] ?? "{}");
  expect(mcp.mcpServers.bun).toEqual({ url: "https://bun.com/mcp" });
});

test("missing pi and cursor mcp.json dests are created from the Preset", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    repoDir: repo,
    homeTree: [".config/opencode/opencode.json"],
    treeContents: {
      ".config/opencode/opencode.json": JSON.stringify({ permission: "allow" }),
    },
    fileContents: mcpSource(repo, { bun: { url: "https://bun.com/mcp" } }),
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  const oc = JSON.parse(host.fileContents[`${home}/.config/opencode/opencode.json`] ?? "{}");
  expect(oc.mcp.bun).toEqual({ type: "remote", url: "https://bun.com/mcp" });
  const pi = JSON.parse(host.fileContents[`${home}/.pi/agent/mcp.json`] ?? "{}");
  const cursor = JSON.parse(host.fileContents[`${home}/.cursor/mcp.json`] ?? "{}");
  expect(pi.mcpServers.bun).toEqual({ url: "https://bun.com/mcp" });
  expect(cursor.mcpServers.bun).toEqual({ url: "https://bun.com/mcp" });
  expect(host.linked).not.toContain(".pi/agent/mcp.json");
  expect(host.linked).not.toContain(".cursor/mcp.json");
});

test("pi mcp-adapter.json is ignored while mcp.json is created from the Preset", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const legacy = `${JSON.stringify({ mcpServers: { old: { url: "https://old.example" } } }, null, 2)}\n`;
  const host = createFakeHost(["bun"], {
    homeDir: home,
    repoDir: repo,
    files: [`${home}/.pi/agent/mcp-adapter.json`],
    fileContents: {
      [`${home}/.pi/agent/mcp-adapter.json`]: legacy,
      ...mcpSource(repo, { bun: { url: "https://bun.com/mcp" } }),
    },
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(host.fileContents[`${home}/.pi/agent/mcp-adapter.json`]).toBe(legacy);
  expect(host.removedFiles).not.toContain(`${home}/.pi/agent/mcp-adapter.json`);
  const pi = JSON.parse(host.fileContents[`${home}/.pi/agent/mcp.json`] ?? "{}");
  expect(pi.mcpServers).toEqual({ bun: { url: "https://bun.com/mcp" } });
});

test("dotfiles stow --dry-run does not write agent MCP configs", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    repoDir: repo,
    homeTree: [
      ".config/opencode/opencode.json",
      ".pi/agent/mcp.json",
      ".cursor/mcp.json",
      ".grok/config.toml",
      ".codex/config.toml",
    ],
    treeContents: {
      ".config/opencode/opencode.json": JSON.stringify({ permission: "allow" }),
      ".pi/agent/mcp.json": "{}\n",
      ".cursor/mcp.json": "{}\n",
      ".grok/config.toml": 'theme = "groknight"\n',
      ".codex/config.toml": "[features]\nhooks = true\n",
    },
    fileContents: mcpSource(repo, { bun: { url: "https://bun.com/mcp" } }),
  });
  const result = await run(["stow", "--dry-run"], host);
  expect(result.exitCode).toBe(0);
  expect(host.fileContents[`${home}/.config/opencode/opencode.json`]).toBeUndefined();
  expect(host.fileExists(`${home}/.pi/agent/mcp.json`)).toBe(false);
  expect(host.fileExists(`${home}/.cursor/mcp.json`)).toBe(false);
  expect(host.fileContents[`${home}/.grok/config.toml`]).toBeUndefined();
  expect(host.fileContents[`${home}/.codex/config.toml`]).toBeUndefined();
});

test("a missing Preset file creates pi and cursor mcp.json from defaults and does not invent curated configs", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".zshrc"],
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
  expect(host.fileExists(`${home}/.config/opencode/opencode.json`)).toBe(false);
  expect(host.fileExists(`${home}/.grok/config.toml`)).toBe(false);
  expect(host.fileExists(`${home}/.codex/config.toml`)).toBe(false);
  const pi = JSON.parse(host.fileContents[`${home}/.pi/agent/mcp.json`] ?? "{}");
  const cursor = JSON.parse(host.fileContents[`${home}/.cursor/mcp.json`] ?? "{}");
  const antigravity = JSON.parse(
    host.fileContents[`${home}/.gemini/config/mcp_config.json`] ?? "{}",
  );
  expect(pi.mcpServers.bun).toEqual({ url: "https://bun.com/docs/mcp" });
  expect(cursor.mcpServers.bun).toEqual({ url: "https://bun.com/docs/mcp" });
  expect(antigravity.mcpServers.bun).toEqual({ url: "https://bun.com/docs/mcp" });
});

test("help still has no mcp command and mcp command is rejected as unknown", async () => {
  const host = createFakeHost(["bun"]);
  const helpResult = await run(["--help"], host);
  expect(helpResult.stdout).not.toMatch(/\bmcp\b/);
  const mcpResult = await run(["mcp"], host);
  expect(mcpResult.exitCode).toBe(1);
  expect(mcpResult.stderr).toContain("unknown command: mcp");
});
