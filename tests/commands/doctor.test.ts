import { expect, test } from "bun:test";
import { run } from "@/cli.ts";
import {
  createFakeHost,
  mcpAgentFiles,
  presentWorkflowCommands,
  skillDirs,
} from "../helpers/fake-host.ts";

function healthyWorkflow(
  home: string,
  extra: { files?: string[]; fileContents?: Record<string, string> } = {},
) {
  const mcp = mcpAgentFiles(home);
  return {
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      ...skillDirs(home),
      `${home}/.local/bin/dotfiles`,
      ...mcp.files,
      ...(extra.files ?? []),
    ],
    fileContents: { ...mcp.fileContents, ...(extra.fileContents ?? {}) },
  };
}

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
    "mise",
    "npm",
    "bun",
    "pi",
    "herdr",
    "OpenCode",
    "Grok",
    "Codex",
    "gh",
    "agy",
    "Zed",
    "Skills",
    "MCP",
    "login shell",
    "PATH symlink",
  ]) {
    expect(result.stdout).toContain(`[!!]  ${piece}`);
  }
  expect(result.stdout).toContain("Workflow");
  expect(result.stdout).toContain("0/20 required ok");
});

test("doctor reports mise missing as a required failure", async () => {
  const host = createFakeHost();
  const result = await run(["doctor"], host);
  expect(result.exitCode).not.toBe(0);
  expect(result.stdout).toContain("[!!]  mise");
  expect(result.stdout).not.toMatch(/mise.*optional/i);
});

test("doctor does not mention nvm", async () => {
  const host = createFakeHost();
  const result = await run(["doctor"], host);
  expect(result.stdout).not.toMatch(/nvm/i);
  expect(result.stderr).not.toMatch(/nvm/i);
});

test("doctor MCP fails when agent dests are stale versus the Preset", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const mcp = mcpAgentFiles(home, { bun: { url: "https://old.example/mcp" } });
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    repoDir: repo,
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      ...skillDirs(home),
      `${home}/.local/bin/dotfiles`,
      ...mcp.files,
      `${repo}/dotfiles.json`,
    ],
    fileContents: {
      ...mcp.fileContents,
      [`${repo}/dotfiles.json`]: JSON.stringify({
        mcp: { bun: { url: "https://bun.com/docs/mcp" } },
      }),
    },
    loginShell: "/bin/zsh",
  });
  const before = host.fileContents[`${home}/.pi/agent/mcp.json`];
  const result = await run(["doctor"], host);
  expect(result.exitCode).not.toBe(0);
  expect(result.stdout).toContain("[!!]  MCP");
  expect(host.fileContents[`${home}/.pi/agent/mcp.json`]).toBe(before);
});

test("doctor MCP fails when only the pi dest exists", async () => {
  const home = "/fake-home";
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
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
  const result = await run(["doctor"], host);
  expect(result.exitCode).not.toBe(0);
  expect(result.stdout).toContain("[!!]  MCP");
  expect(result.stdout).not.toContain("[ok]  MCP");
});

test("Ghostty missing is a warning, not a required failure", async () => {
  const home = "/fake-home";
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    ...healthyWorkflow(home),
    loginShell: "/bin/zsh",
  });
  const result = await run(["doctor"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("[skip] Ghostty");
  expect(result.stdout).not.toContain("[!!]  Ghostty");
  expect(result.stdout).toContain("Optional");
  expect(result.stdout).toContain("[ok]  mise");
  expect(result.stdout).toContain("20 required ok");
});

test("doctor never prints API Key values", async () => {
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: JSON.stringify({ apiKeys: ["OPENROUTER_API_KEY"] }),
    },
    environmentKeys: { OPENROUTER_API_KEY: "sk-secret-do-not-leak" },
  });
  const result = await run(["doctor"], host);
  expect(result.stdout).toContain("API Keys");
  expect(result.stdout).toContain("[ok]  OPENROUTER_API_KEY");
  expect(result.stdout).not.toContain("sk-secret-do-not-leak");
  expect(result.stderr).not.toContain("sk-secret-do-not-leak");
});

test("doctor reports missing expected API Key names as failures without extra required rows", async () => {
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: JSON.stringify({ apiKeys: ["OPENROUTER_API_KEY"] }),
    },
  });
  const result = await run(["doctor"], host);
  expect(result.exitCode).not.toBe(0);
  expect(result.stdout).toContain("API Keys");
  expect(result.stdout).toContain("[!!]  OPENROUTER_API_KEY");
  expect(result.stdout).not.toContain("[ok]  OPENROUTER_API_KEY");
  expect(result.stdout).toContain("1/20 required ok");
});

test("doctor lists only expected API Key names and ignores PATH", async () => {
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: JSON.stringify({
        apiKeys: ["OPENROUTER_API_KEY", "ANTHROPIC_API_KEY"],
      }),
    },
    environmentKeys: {
      PATH: "/usr/bin",
      KEEP: "yes",
      OPENROUTER_API_KEY: "sk-secret",
    },
  });
  const result = await run(["doctor"], host);
  expect(result.exitCode).not.toBe(0);
  expect(result.stdout).toContain("[ok]  OPENROUTER_API_KEY");
  expect(result.stdout).toContain("[!!]  ANTHROPIC_API_KEY");
  expect(result.stdout).not.toMatch(/API Keys[\s\S]*\bPATH\b/);
  expect(result.stdout).not.toContain("KEEP");
  expect(result.stdout).not.toContain("sk-secret");
});

test("empty apiKeys omits the API Keys section", async () => {
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: JSON.stringify({ apiKeys: [] }),
    },
    environmentKeys: { PATH: "/usr/bin", OPENROUTER_API_KEY: "sk-secret" },
  });
  const result = await run(["doctor"], host);
  expect(result.stdout).not.toContain("API Keys");
  expect(result.stdout).not.toContain("OPENROUTER_API_KEY");
});

test("a healthy Host with a missing expected API Key exits 1 and is not complete", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    repoDir: repo,
    ...healthyWorkflow(home, {
      files: [`${repo}/dotfiles.json`],
      fileContents: {
        [`${repo}/dotfiles.json`]: JSON.stringify({ apiKeys: ["OPENROUTER_API_KEY"] }),
      },
    }),
    loginShell: "/bin/zsh",
  });
  const human = await run(["doctor"], host);
  const json = await run(["doctor", "--json"], host);
  expect(human.exitCode).toBe(1);
  expect(json.exitCode).toBe(1);
  expect(human.stdout).toContain("[!!]  OPENROUTER_API_KEY");
  expect(human.stdout).toContain("20 required ok");
  const body = JSON.parse(json.stdout) as {
    isComplete: boolean;
    isBootstrapped: boolean;
    keys: { name: string; ok: boolean }[];
  };
  expect(body.isComplete).toBe(false);
  expect(body.isBootstrapped).toBe(true);
  expect(body.keys).toEqual([{ name: "OPENROUTER_API_KEY", ok: false }]);
});

test("doctor reports broken Stow links", async () => {
  const host = createFakeHost(["bun"], {
    brokenStowLinks: ["/fake-home/.zshrc"],
  });
  const result = await run(["doctor"], host);
  expect(result.stdout).toContain("Stow");
  expect(result.stdout).toContain("[!!]  /fake-home/.zshrc");
});

test("doctor reports Skills missing when ~/.agents/skills exists without the declared skills", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    files: [`${home}/.agents/skills/diagnose-crash`],
  });
  const result = await run(["doctor"], host);
  expect(result.exitCode).not.toBe(0);
  expect(result.stdout).toContain("[!!]  Skills");
});

test("doctor reports Grok, Codex, gh, and agy missing as required failures", async () => {
  const host = createFakeHost();
  const result = await run(["doctor"], host);
  expect(result.exitCode).not.toBe(0);
  expect(result.stdout).toContain("[!!]  Grok");
  expect(result.stdout).toContain("[!!]  Codex");
  expect(result.stdout).toContain("[!!]  gh");
  expect(result.stdout).toContain("[!!]  agy");
  expect(result.stdout).not.toMatch(/Grok.*optional/);
});

test("doctor reports OpenCode missing as a required failure", async () => {
  const host = createFakeHost();
  const result = await run(["doctor"], host);
  expect(result.exitCode).not.toBe(0);
  expect(result.stdout).toContain("[!!]  OpenCode");
  expect(result.stdout).not.toMatch(/OpenCode.*optional/);
});

test("doctor reports OpenCode and Zed present without treating them as optional", async () => {
  const home = "/fake-home";
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    ...healthyWorkflow(home),
    loginShell: "/bin/zsh",
  });
  const result = await run(["doctor"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("[ok]  OpenCode");
  expect(result.stdout).not.toMatch(/OpenCode.*optional/);
  expect(result.stdout).toContain("[ok]  Grok");
  expect(result.stdout).toContain("[ok]  Codex");
  expect(result.stdout).toContain("[ok]  gh");
  expect(result.stdout).toContain("[ok]  agy");
  expect(result.stdout).toContain("[ok]  Zed");
  expect(result.stdout).not.toMatch(/Zed.*optional/);
});

test("doctor respects preset skills override in dotfiles.json", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    repoDir: repo,
    ...healthyWorkflow(home, {
      files: [`${home}/.agents/skills/custom-skill`, `${repo}/dotfiles.json`],
      fileContents: {
        [`${repo}/dotfiles.json`]: JSON.stringify({
          skills: ["custom/repo@custom-skill"],
        }),
      },
    }),
    loginShell: "/bin/zsh",
  });
  const result = await run(["doctor"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("[ok]  Skills");
});

test("invalid dotfiles.json causes doctor to fail with error", async () => {
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: "{ invalid json }",
    },
  });
  const result = await run(["doctor"], host);
  expect(result.exitCode).not.toBe(0);
  expect(result.stderr).toContain("Failed to parse dotfiles.json");
});

test("doctor does not require zed when tools.zed is false", async () => {
  const home = "/fake-home";
  const repo = "/fake-repo";
  const host = createFakeHost(
    presentWorkflowCommands.filter((command) => command !== "zed"),
    {
      homeDir: home,
      repoDir: repo,
      ...healthyWorkflow(home, {
        files: [`${repo}/dotfiles.json`],
        fileContents: {
          [`${repo}/dotfiles.json`]: JSON.stringify({
            tools: { zed: false },
          }),
        },
      }),
      loginShell: "/bin/zsh",
    },
  );
  const result = await run(["doctor"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).not.toContain("Zed");
});

test("doctor --json prints Workflow Health JSON and exits non-zero on an empty Host", async () => {
  const host = createFakeHost();
  const result = await run(["doctor", "--json"], host);
  expect(result.exitCode).not.toBe(0);
  const body = JSON.parse(result.stdout) as {
    requiredChecks: { label: string; ok: boolean }[];
    optional: { ghostty: boolean };
    keys: string[];
    brokenStowLinks: string[];
    isComplete: boolean;
  };
  expect(body.isComplete).toBe(false);
  expect(body.optional.ghostty).toBe(false);
  expect(body.keys).toEqual([]);
  expect(body.brokenStowLinks).toEqual([]);
  expect(body.requiredChecks.some((check) => check.label === "mise" && check.ok === false)).toBe(
    true,
  );
  expect(result.stdout).not.toContain("DOTFILES  doctor");
});

test("doctor --json on a healthy Host exits zero and matches human doctor exit code", async () => {
  const home = "/fake-home";
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    ...healthyWorkflow(home),
    loginShell: "/bin/zsh",
  });
  const human = await run(["doctor"], host);
  const json = await run(["doctor", "--json"], host);
  expect(human.exitCode).toBe(0);
  expect(json.exitCode).toBe(0);
  expect(human.stdout).toContain("DOTFILES  doctor");
  const body = JSON.parse(json.stdout) as { isComplete: boolean; optional: { ghostty: boolean } };
  expect(body.isComplete).toBe(true);
  expect(body.optional.ghostty).toBe(false);
});

test("doctor --json never contains API Key values", async () => {
  const repo = "/fake-repo";
  const host = createFakeHost(["bun"], {
    repoDir: repo,
    files: [`${repo}/dotfiles.json`],
    fileContents: {
      [`${repo}/dotfiles.json`]: JSON.stringify({ apiKeys: ["OPENROUTER_API_KEY"] }),
    },
    environmentKeys: { OPENROUTER_API_KEY: "sk-secret-do-not-leak" },
  });
  const result = await run(["doctor", "--json"], host);
  const body = JSON.parse(result.stdout) as { keys: { name: string; ok: boolean }[] };
  expect(body.keys).toEqual([{ name: "OPENROUTER_API_KEY", ok: true }]);
  expect(result.stdout).not.toContain("sk-secret-do-not-leak");
  expect(result.stderr).not.toContain("sk-secret-do-not-leak");
});

test("doctor --json includes broken Stow links and exits non-zero", async () => {
  const home = "/fake-home";
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    ...healthyWorkflow(home),
    loginShell: "/bin/zsh",
    brokenStowLinks: [`${home}/.zshrc`],
  });
  const result = await run(["doctor", "--json"], host);
  expect(result.exitCode).toBe(1);
  const body = JSON.parse(result.stdout) as { brokenStowLinks: string[]; isComplete: boolean };
  expect(body.brokenStowLinks).toEqual([`${home}/.zshrc`]);
  expect(body.isComplete).toBe(true);
});

test("doctor --json --help prints doctor help and does no work", async () => {
  const host = createFakeHost();
  const result = await run(["doctor", "--json", "--help"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("Usage: dotfiles doctor");
  expect(result.stdout).toContain("--json");
  expect(result.stderr).toBe("");
});

test("--json on init, stow, clean, or sync fails closed", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  for (const cmd of ["init", "stow", "clean", "sync"]) {
    const result = await run([cmd, "--json"], host);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("unknown option: --json");
    expect(result.stdout).toBe("");
  }
  expect(host.packagesRequested).toEqual([]);
  expect(host.linked).toEqual([]);
  expect(host.repoPulls).toBe(0);
});
