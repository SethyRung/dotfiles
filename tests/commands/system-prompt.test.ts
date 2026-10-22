import { expect, test } from "bun:test";
import { join } from "node:path";
import { run } from "@/cli.ts";
import {
  createFakeHost,
  piPackageDirs,
  presentWorkflowCommands,
  skillDirs,
} from "../helpers/fake-host.ts";

const home = "/fake-home";
const repo = "/fake-repo with spaces";
const source = `${repo}/src/consts/system-prompt.md`;
const CURSOR_PLUGIN = ".cursor/plugins/local/dotfiles-system-prompt";
const CURSOR_MANIFEST = `${CURSOR_PLUGIN}/.cursor-plugin/plugin.json`;
const CURSOR_RULE = `${CURSOR_PLUGIN}/rules/system-prompt.mdc`;
const LEGACY_CURSOR_RULE = ".cursor/rules/system-prompt.mdc";
const destinations = [".pi/agent/APPEND_SYSTEM.md", ".codex/AGENTS.md", CURSOR_RULE];

function mirroredPrompt(rel: string, text: string): string {
  if (rel === CURSOR_RULE) {
    return `---\nalwaysApply: true\n---\n\n${text}`;
  }
  return text;
}
const prompt = await Bun.file(join(import.meta.dir, "../../src/consts/system-prompt.md")).text();

for (const command of ["init", "stow", "sync"]) {
  test(`${command} creates and refreshes system prompts without Stow templates`, async () => {
    const host = createFakeHost(["bun"], {
      homeDir: home,
      repoDir: repo,
      packageManager: "apt",
      files: [`${home}/.pi/agent/APPEND_SYSTEM.md`],
      fileContents: {
        [source]: prompt,
        [`${home}/.pi/agent/APPEND_SYSTEM.md`]: "Old instructions.\n",
      },
    });

    const result = await run([command, ...(command === "init" ? ["--yes"] : [])], host);

    expect(result.exitCode).toBe(0);
    expect(prompt).toContain("Response style:");
    for (const rel of destinations) {
      expect(host.linked).not.toContain(rel);
      expect(host.fileContents[`${home}/${rel}`]).toBe(mirroredPrompt(rel, prompt));
    }
    expect(JSON.parse(host.fileContents[`${home}/${CURSOR_MANIFEST}`] ?? "{}")).toEqual({
      name: "dotfiles-system-prompt",
      description: "Shared Workflow instructions",
    });
    expect(host.linked).not.toContain(CURSOR_MANIFEST);
    expect(host.fileExists(`${home}/${LEGACY_CURSOR_RULE}`)).toBe(false);
    expect(host.backups).toEqual([]);
    expect(host.fileContents[source]).toBe(prompt);

    host.fileContents[source] = "Updated shared instructions.\n";
    expect((await run([command, "--dry-run"], host)).exitCode).toBe(0);
    for (const rel of destinations) {
      expect(host.fileContents[`${home}/${rel}`]).toBe(mirroredPrompt(rel, prompt));
    }

    const updated = "Updated shared instructions.\n";
    expect((await run([command, ...(command === "init" ? ["--yes"] : [])], host)).exitCode).toBe(0);
    for (const rel of destinations) {
      expect(host.fileContents[`${home}/${rel}`]).toBe(mirroredPrompt(rel, updated));
    }
  });

  test(`${command} --dry-run does not create system prompt destinations`, async () => {
    const host = createFakeHost(["bun"], {
      homeDir: home,
      repoDir: repo,
      packageManager: "apt",
      fileContents: { [source]: prompt },
    });

    expect((await run([command, "--dry-run"], host)).exitCode).toBe(0);
    expect(host.fileContents).toEqual({ [source]: prompt });
    expect(host.linked).toEqual([]);
  });
}

test("a missing system prompt source leaves agent instructions unchanged", async () => {
  const existing = {
    [`${home}/.pi/agent/APPEND_SYSTEM.md`]: "Existing instructions.\n",
  };
  const host = createFakeHost(["bun"], {
    homeDir: home,
    repoDir: repo,
    files: [`${home}/.pi/agent/APPEND_SYSTEM.md`],
    fileContents: existing,
  });

  expect((await run(["stow"], host)).exitCode).toBe(0);
  expect(host.fileContents[`${home}/.pi/agent/APPEND_SYSTEM.md`]).toBe("Existing instructions.\n");
  expect(host.fileExists(`${home}/.codex/AGENTS.md`)).toBe(false);
  expect(host.fileExists(`${home}/${CURSOR_RULE}`)).toBe(false);
  expect(host.fileExists(`${home}/${CURSOR_MANIFEST}`)).toBe(false);
});

for (const command of ["init", "stow", "sync"]) {
  test(`${command} migrates only an unchanged legacy Cursor rule`, async () => {
    for (const legacy of [mirroredPrompt(CURSOR_RULE, prompt), "Personal instructions.\n"]) {
      const path = `${home}/${LEGACY_CURSOR_RULE}`;
      const host = createFakeHost(["bun"], {
        homeDir: home,
        repoDir: repo,
        packageManager: "apt",
        files: [path],
        fileContents: { [source]: prompt, [path]: legacy },
      });

      expect((await run([command, "--dry-run"], host)).exitCode).toBe(0);
      expect(host.fileContents[path]).toBe(legacy);
      expect(host.fileExists(`${home}/${CURSOR_MANIFEST}`)).toBe(false);

      expect((await run([command, ...(command === "init" ? ["--yes"] : [])], host)).exitCode).toBe(
        0,
      );
      expect(host.fileContents[`${home}/${CURSOR_RULE}`]).toBe(mirroredPrompt(CURSOR_RULE, prompt));
      if (legacy === mirroredPrompt(CURSOR_RULE, prompt)) {
        expect(host.fileExists(path)).toBe(false);
      } else {
        expect(host.fileContents[path]).toBe(legacy);
      }
    }
  });
}

test("an empty shared system prompt clears previous mirrored instructions", async () => {
  const host = createFakeHost(["bun"], {
    homeDir: home,
    repoDir: repo,
    fileContents: { [source]: "" },
  });

  expect((await run(["stow"], host)).exitCode).toBe(0);
  for (const rel of destinations) {
    expect(host.fileContents[`${home}/${rel}`]).toBe(mirroredPrompt(rel, ""));
  }
});

test("declining a Stow conflict still writes system prompts", async () => {
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    repoDir: repo,
    packageManager: "apt",
    loginShell: "/bin/zsh",
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      `${home}/.zshrc`,
      `${home}/.pi/agent/APPEND_SYSTEM.md`,
      ...skillDirs(home),
      ...piPackageDirs(home),
    ],
    homeTree: [".zshrc"],
    treeContents: { ".zshrc": "repo zshrc\n" },
    fileContents: {
      [source]: prompt,
      [`${home}/.zshrc`]: "personal zshrc\n",
      [`${home}/.pi/agent/APPEND_SYSTEM.md`]: "Personal instructions.\n",
    },
    promptAnswers: ["y", "", "", "n"],
  });

  expect((await run(["init"], host)).exitCode).toBe(0);
  expect(host.prompts).toContain("Overwrite existing files with Stow? [y/N] ");
  expect(host.linked).toEqual([]);
  expect(host.backups).toEqual([]);
  expect(host.fileContents[`${home}/.zshrc`]).toBe("personal zshrc\n");
  expect(host.fileContents[`${home}/.pi/agent/APPEND_SYSTEM.md`]).toBe(prompt);
  expect(host.fileContents[`${home}/.codex/AGENTS.md`]).toBe(prompt);
  expect(host.fileContents[`${home}/${CURSOR_RULE}`]).toBe(mirroredPrompt(CURSOR_RULE, prompt));
});
