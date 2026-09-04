import { expect, test } from "bun:test";
import { run } from "@/cli.ts";
import { createFakeHost } from "./helpers/fake-host.ts";

test("dotfiles help lists init, doctor, stow, clean, and sync", async () => {
  const host = createFakeHost(["bun"]);
  const result = await run(["--help"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("init");
  expect(result.stdout).toContain("doctor");
  expect(result.stdout).toContain("stow");
  expect(result.stdout).toContain("clean");
  expect(result.stdout).toContain("sync");
  expect(result.stdout).not.toContain("update");
  expect(result.stdout).not.toContain("repair");
});

test("no arguments and --help print help and exit zero", async () => {
  const host = createFakeHost(["bun"]);
  const noArgs = await run([], host);
  expect(noArgs.exitCode).toBe(0);
  expect(noArgs.stdout).toContain("init");
  const helpFlag = await run(["-h"], host);
  expect(helpFlag.exitCode).toBe(0);
  expect(helpFlag.stdout).toContain("init");
});

test("unknown command exits non-zero with the error and help on stderr", async () => {
  const host = createFakeHost(["bun"]);
  const result = await run(["bogus"], host);
  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain("unknown command: bogus");
  expect(result.stderr).toContain("init");
  expect(result.stdout).toBe("");
});

test("run does not curl-install bun when it is missing; the bash stub owns the chicken-egg", async () => {
  const host = createFakeHost();
  const result = await run(["--help"], host);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("init");
  expect(host.upstreamInstalls).toEqual([]);
});

test("dotfiles init --help and -h print init help, exit 0, and do no work", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });
  for (const flag of ["--help", "-h"]) {
    const result = await run(["init", flag], host);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Usage: dotfiles init");
    expect(result.stdout).not.toContain("Usage: dotfiles doctor");
    expect(result.stderr).toBe("");
    expect(host.packagesRequested).toEqual([]);
    expect(host.upstreamInstalls).toEqual([]);
    expect(host.linked).toEqual([]);
    expect(host.prompts).toEqual([]);
  }
});

test("doctor, stow, clean, and sync each print their own help on --help / -h and do no work", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    files: [`${home}/.stow-backup-1`],
  });

  const commands = [
    { name: "doctor", title: "Usage: dotfiles doctor" },
    { name: "stow", title: "Usage: dotfiles stow" },
    { name: "clean", title: "Usage: dotfiles clean" },
    { name: "sync", title: "Usage: dotfiles sync" },
  ];

  for (const cmd of commands) {
    for (const flag of ["--help", "-h"]) {
      const result = await run([cmd.name, flag], host);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(cmd.title);
      expect(result.stderr).toBe("");
    }
  }

  expect(host.linked).toEqual([]);
  expect(host.prompts).toEqual([]);
  expect(host.removedFiles).toEqual([]);
  expect(host.repoPulls).toBe(0);
});

test("--help together with other argv still prints help and does no work", async () => {
  const host = createFakeHost(["bun"], { packageManager: "apt" });

  const cases = [
    { args: ["init", "--please", "--help"], expected: "Usage: dotfiles init" },
    { args: ["stow", "--dry-run", "--help"], expected: "Usage: dotfiles stow" },
    { args: ["sync", "-h", "extra"], expected: "Usage: dotfiles sync" },
    { args: ["clean", "now", "-h"], expected: "Usage: dotfiles clean" },
    { args: ["doctor", "--check", "--help"], expected: "Usage: dotfiles doctor" },
  ];

  for (const { args, expected } of cases) {
    const result = await run(args, host);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(expected);
    expect(result.stderr).toBe("");
  }

  expect(host.packagesRequested).toEqual([]);
  expect(host.linked).toEqual([]);
  expect(host.prompts).toEqual([]);
  expect(host.repoPulls).toBe(0);
});

test("an unknown flag or extra positional on any command exits 1, writes nothing, and does not run the command", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    files: [`${home}/.stow-backup-1`],
    packageManager: "apt",
  });

  const cases = [
    { args: ["init", "--please"], error: "unknown option: --please", help: "Usage: dotfiles init" },
    { args: ["init", "extra"], error: "unexpected argument: extra", help: "Usage: dotfiles init" },
    { args: ["doctor", "--flag"], error: "unknown option: --flag", help: "Usage: dotfiles doctor" },
    {
      args: ["doctor", "extra"],
      error: "unexpected argument: extra",
      help: "Usage: dotfiles doctor",
    },
    {
      args: ["stow", "--invalid"],
      error: "unknown option: --invalid",
      help: "Usage: dotfiles stow",
    },
    { args: ["stow", "foo"], error: "unexpected argument: foo", help: "Usage: dotfiles stow" },
    { args: ["clean", "--force"], error: "unknown option: --force", help: "Usage: dotfiles clean" },
    { args: ["clean", "now"], error: "unexpected argument: now", help: "Usage: dotfiles clean" },
    {
      args: ["sync", "--dry-run"],
      error: "unknown option: --dry-run",
      help: "Usage: dotfiles sync",
    },
    { args: ["sync", "bar"], error: "unexpected argument: bar", help: "Usage: dotfiles sync" },
  ];

  for (const { args, error, help } of cases) {
    const result = await run(args, host);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(error);
    expect(result.stderr).toContain(help);
  }

  expect(host.packagesRequested).toEqual([]);
  expect(host.linked).toEqual([]);
  expect(host.prompts).toEqual([]);
  expect(host.removedFiles).toEqual([]);
  expect(host.repoPulls).toBe(0);
});
