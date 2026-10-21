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
const destinations = [".pi/agent/APPEND_SYSTEM.md", ".codex/AGENTS.md"];
const prompt = await Bun.file(join(import.meta.dir, "../../src/consts/system-prompt.md")).text();
const templates = Object.fromEntries(
  await Promise.all(
    destinations.map(async (rel) => [
      rel,
      await Bun.file(join(import.meta.dir, "../../home", rel)).text(),
    ]),
  ),
);

for (const command of ["init", "stow", "sync"]) {
  test(`${command} mirrors the shared system prompt to pi and Codex after Stow`, async () => {
    const host = createFakeHost(["bun"], {
      homeDir: home,
      repoDir: repo,
      packageManager: "apt",
      homeTree: destinations,
      treeContents: templates,
      files: destinations.map((rel) => `${home}/${rel}`),
      fileContents: {
        [source]: prompt,
        ...Object.fromEntries(destinations.map((rel) => [`${home}/${rel}`, "Old instructions.\n"])),
      },
    });

    const result = await run([command, ...(command === "init" ? ["--yes"] : [])], host);

    expect(result.exitCode).toBe(0);
    expect(prompt).toContain("Response style:");
    for (const rel of destinations) {
      expect(host.linked).toContain(rel);
      expect(host.backups.some((path) => path.startsWith(`${home}/${rel}.`))).toBe(true);
      expect(host.fileContents[`${home}/${rel}`]).toBe(prompt);
    }
    expect(host.fileContents[source]).toBe(prompt);

    host.fileContents[source] = "Updated shared instructions.\n";
    expect((await run([command, "--dry-run"], host)).exitCode).toBe(0);
    for (const rel of destinations) {
      expect(host.fileContents[`${home}/${rel}`]).toBe(prompt);
    }

    expect((await run([command, ...(command === "init" ? ["--yes"] : [])], host)).exitCode).toBe(0);
    for (const rel of destinations) {
      expect(host.fileContents[`${home}/${rel}`]).toBe("Updated shared instructions.\n");
    }
  });

  test(`${command} --dry-run does not create system prompt destinations`, async () => {
    const host = createFakeHost(["bun"], {
      homeDir: home,
      repoDir: repo,
      packageManager: "apt",
      homeTree: destinations,
      treeContents: templates,
      fileContents: { [source]: prompt },
    });

    expect((await run([command, "--dry-run"], host)).exitCode).toBe(0);
    expect(host.fileContents).toEqual({ [source]: prompt });
    expect(host.linked).toEqual([]);
  });
}

test("system prompt adapters skip missing destinations independently", async () => {
  for (const rel of destinations) {
    const host = createFakeHost(["bun"], {
      homeDir: home,
      repoDir: repo,
      homeTree: [rel],
      treeContents: templates,
      fileContents: { [source]: prompt },
    });

    expect((await run(["stow"], host)).exitCode).toBe(0);
    expect(host.fileContents[`${home}/${rel}`]).toBe(prompt);
    for (const missing of destinations.filter((destination) => destination !== rel)) {
      expect(host.fileExists(`${home}/${missing}`)).toBe(false);
      expect(host.fileContents[`${home}/${missing}`]).toBeUndefined();
    }
  }
});

test("a missing system prompt source leaves agent instructions unchanged", async () => {
  const existing = Object.fromEntries(
    destinations.map((rel) => [`${home}/${rel}`, "Existing instructions.\n"]),
  );
  const host = createFakeHost(["bun"], {
    homeDir: home,
    repoDir: repo,
    fileContents: existing,
  });

  expect((await run(["stow"], host)).exitCode).toBe(0);
  expect(host.fileContents).toEqual(existing);
});

test("an empty shared system prompt clears previous mirrored instructions", async () => {
  const host = createFakeHost(["bun"], {
    homeDir: home,
    repoDir: repo,
    homeTree: destinations,
    treeContents: templates,
    fileContents: { [source]: "" },
  });

  expect((await run(["stow"], host)).exitCode).toBe(0);
  for (const rel of destinations) {
    expect(host.fileContents[`${home}/${rel}`]).toBe("");
  }
});

test("init preserves system prompts when Stow conflicts are declined", async () => {
  const existing = Object.fromEntries(
    destinations.map((rel) => [`${home}/${rel}`, "Personal instructions.\n"]),
  );
  const host = createFakeHost(presentWorkflowCommands, {
    homeDir: home,
    repoDir: repo,
    packageManager: "apt",
    loginShell: "/bin/zsh",
    files: [
      `${home}/.oh-my-zsh`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-autosuggestions`,
      `${home}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`,
      ...skillDirs(home),
      ...piPackageDirs(home),
      ...destinations.map((rel) => `${home}/${rel}`),
    ],
    homeTree: destinations,
    treeContents: templates,
    fileContents: { [source]: prompt, ...existing },
    promptAnswers: ["y", "", "", "n"],
  });

  expect((await run(["init"], host)).exitCode).toBe(0);
  expect(host.prompts).toContain("Overwrite existing files with Stow? [y/N] ");
  expect(host.linked).toEqual([]);
  expect(host.backups).toEqual([]);
  for (const rel of destinations) {
    expect(host.fileContents[`${home}/${rel}`]).toBe(existing[`${home}/${rel}`]);
  }
});
