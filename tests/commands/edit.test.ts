import { expect, test } from "bun:test";
import { run } from "@/cli.ts";
import { createFakeHost } from "../helpers/fake-host.ts";

const repoDir = "/fake-repo";
const preset = `${repoDir}/dotfiles.json`;

test("dotfiles edit opens dotfiles.json in $EDITOR and exits zero", async () => {
  const host = createFakeHost([], { repoDir });
  const result = await run(["edit"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toBe(`Opened ${preset} in $EDITOR.\n`);
  expect(result.stderr).toBe("");
  expect(host.editorOpens).toEqual([preset]);
  expect(host.packagesRequested).toEqual([]);
  expect(host.linked).toEqual([]);
  expect(host.prompts).toEqual([]);
  expect(host.repoPulls).toBe(0);
});

test("dotfiles edit reports an editor failure and exits non-zero", async () => {
  const host = createFakeHost([], {
    repoDir,
    editorError: "EDITOR is not set. Set $EDITOR to edit dotfiles.json.",
  });
  const result = await run(["edit"], host);
  expect(result.exitCode).toBe(1);
  expect(result.stdout).toBe("");
  expect(result.stderr).toContain("EDITOR is not set");
  expect(host.editorOpens).toEqual([]);
});

test("dotfiles edit --help and -h print edit help and never open an editor", async () => {
  const host = createFakeHost([], { repoDir });
  for (const flag of ["--help", "-h"]) {
    const result = await run(["edit", flag], host);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Usage: dotfiles edit");
    expect(result.stdout).not.toContain("Usage: dotfiles sync");
    expect(result.stderr).toBe("");
  }
  expect(host.editorOpens).toEqual([]);
});

test("edit rejects unknown flags and extra positionals without opening an editor", async () => {
  const host = createFakeHost([], { repoDir });
  const cases = [
    { args: ["edit", "--path"], error: "unknown option: --path" },
    { args: ["edit", "extra"], error: "unexpected argument: extra" },
  ];
  for (const { args, error } of cases) {
    const result = await run(args, host);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(error);
    expect(result.stderr).toContain("Usage: dotfiles edit");
  }
  expect(host.editorOpens).toEqual([]);
});

test("top-level help lists edit and its description", async () => {
  const host = createFakeHost();
  const result = await run(["--help"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("edit");
  expect(result.stdout).toContain("Open dotfiles.json in $EDITOR");
});
