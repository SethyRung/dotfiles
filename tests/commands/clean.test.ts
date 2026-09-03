import { expect, test } from "bun:test";
import { run } from "@/cli.ts";
import { createFakeHost } from "../helpers/fake-host.ts";

test("dotfiles clean with no Stow backups is a no-op", async () => {
  const host = createFakeHost(["bun"]);
  const result = await run(["clean"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("No Stow backups to clean.");
  expect(host.prompts).toEqual([]);
  expect(host.removedFiles).toEqual([]);
});

test("dotfiles clean lists the backups, confirms, then deletes them", async () => {
  const home = "/fake-home";
  const backups = [
    `${home}/.zshrc.2026-01-01_10:30:20`,
    `${home}/.config/ghostty/config.2026-01-01_10:30:20`,
  ];
  const host = createFakeHost(["bun"], {
    stowBackups: backups,
    promptAnswers: ["y"],
  });
  const result = await run(["clean"], host);
  expect(result.exitCode).toBe(0);
  expect(host.prompts).toEqual(["Delete 2 Stow backup file(s)? [y/N] "]);
  expect(host.removedFiles).toEqual(backups);
  expect(result.stdout).toContain("Deleted 2 Stow backup file(s):");
  expect(result.stdout).toContain(`${home}/.zshrc.2026-01-01_10:30:20`);
  expect(result.stdout).toContain(`${home}/.config/ghostty/config.2026-01-01_10:30:20`);
});

test("dotfiles clean declined keeps the backups", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    stowBackups: [`${home}/.zshrc.2026-01-01_10:30:20`],
  });
  const result = await run(["clean"], host);
  expect(result.exitCode).toBe(0);
  expect(host.removedFiles).toEqual([]);
  expect(result.stdout).toContain("Kept 1 Stow backup file(s):");
  expect(result.stdout).toContain(`${home}/.zshrc.2026-01-01_10:30:20`);
});
