import { expect, test } from "bun:test";
import { run } from "@/cli.ts";
import { createFakeHost, skillDirs } from "../helpers/fake-host.ts";

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
    "Zed",
    "Skills",
    "XDG MCP",
    "login shell",
    "PATH symlink",
  ]) {
    expect(result.stdout).toContain(`[!!]  ${piece}`);
  }
  expect(result.stdout).toContain("Workflow");
  expect(result.stdout).toContain("0/16 required ok");
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

test("Ghostty missing is a warning, not a required failure", async () => {
  const home = "/fake-home";
  const host = createFakeHost(
    ["zsh", "git", "stow", "mise", "npm", "bun", "pi", "herdr", "opencode", "zed"],
    {
      homeDir: home,
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        ...skillDirs(home),
        `${home}/.config/mcp/mcp.json`,
        `${home}/.local/bin/dotfiles`,
      ],
      loginShell: "/bin/zsh",
    },
  );
  const result = await run(["doctor"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("[skip] Ghostty");
  expect(result.stdout).not.toContain("[!!]  Ghostty");
  expect(result.stdout).toContain("Optional");
  expect(result.stdout).toContain("[ok]  mise");
  expect(result.stdout).toContain("16 required ok");
});

test("doctor never prints API Key values", async () => {
  const host = createFakeHost(["bun"], {
    environmentKeys: { OPENROUTER_API_KEY: "sk-secret-do-not-leak" },
  });
  const result = await run(["doctor"], host);
  expect(result.stdout).toContain("API Keys");
  expect(result.stdout).toContain("[ok]  OPENROUTER_API_KEY");
  expect(result.stdout).not.toContain("sk-secret-do-not-leak");
  expect(result.stderr).not.toContain("sk-secret-do-not-leak");
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

test("doctor reports OpenCode missing as a required failure", async () => {
  const host = createFakeHost();
  const result = await run(["doctor"], host);
  expect(result.exitCode).not.toBe(0);
  expect(result.stdout).toContain("[!!]  OpenCode");
  expect(result.stdout).not.toMatch(/OpenCode.*optional/);
});

test("doctor reports OpenCode and Zed present without treating them as optional", async () => {
  const home = "/fake-home";
  const host = createFakeHost(
    ["zsh", "git", "stow", "mise", "npm", "bun", "pi", "herdr", "opencode", "zed"],
    {
      homeDir: home,
      files: [
        `${home}/.oh-my-zsh`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
        `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
        ...skillDirs(home),
        `${home}/.config/mcp/mcp.json`,
        `${home}/.local/bin/dotfiles`,
      ],
      loginShell: "/bin/zsh",
    },
  );
  const result = await run(["doctor"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("[ok]  OpenCode");
  expect(result.stdout).not.toMatch(/OpenCode.*optional/);
  expect(result.stdout).toContain("[ok]  Zed");
  expect(result.stdout).not.toMatch(/Zed.*optional/);
});
