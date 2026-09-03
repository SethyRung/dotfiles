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
