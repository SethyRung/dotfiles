import { expect, test } from "bun:test";
import { run } from "@/cli.ts";
import { parseDate } from "@/utils/time.ts";
import { createFakeHost } from "../helpers/fake-host.ts";

test("dotfiles stow on a clean fake $HOME links the home/ tree and PATH stub", async () => {
  const home = "/fake-home";
  const host = createFakeHost(["bun"], {
    homeDir: home,
    homeTree: [".zshrc", ".config/herdr/config.toml"],
  });
  const result = await run(["stow"], host);
  expect(result.exitCode).toBe(0);
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
  expect(host.linked).toEqual([".config/herdr/config.toml"]);
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
  expect(host.backups).toEqual([]);
  expect(host.linked).toEqual([".zshrc", ".config/herdr/config.toml"]);
  expect(host.dotfilesLinks).toBe(1);
});
