# Agent notes

Extend `src/cli.ts` + Host. Commands: `init`, `doctor`, `stow`, `clean`, `sync`.

## Read first

- `CONTEXT.md` — terms.
- `docs/adr/` — binding. Later number wins. Reach when changing Distro support, API Keys, Skills/MCP, Mise Tools, Sync, pi snapshot, repo location, or the CLI name.
- `docs/specs/` — ready-for-agent. Done specs and `.scratch/` tickets are historical.

## Verify

```
bun run lint && bun run fmt:check && bun run typecheck && bun test
```

One test: `bun test -t "substring"`. oxfmt ignores `home/`. oxlint allows `any`. Imports keep `.ts` extensions (`@/` → `src/`).

## Architecture

`./dotfiles` (bash stub; chicken-eggs mise then bun if bun is missing) → `src/main.ts` → `run(args, host)` in `src/cli.ts`. Host (`src/types/host.ts`) is the only seam. Production: `unixHost`. Tests call `run()` with `createFakeHost` — no `./dotfiles` exec, no real apt/curl/sudo/`/etc/environment`, no unit tests of internals.

- `commandExists` looks in PATH, `~/.local/bin`, and mise install dirs/shims. Leftover `~/.bun`, `~/.nvm`, `~/.opencode/bin` are not installed.
- `host.stowTree()` is direct `home/` → `$HOME` symlinks. Repo links are left; stale/other symlinks are replaced; regular files get a `YYYY-MM-DD_HH:mm:ss` stamp then link.

## Traps

- Linux Package Map + Upstream Installs + Mise Tools. Unknown Distro fails before any install. Ghostty is optional (prompt default no; no zypper mapping — warn, don't abort).
- Skills live in `src/consts/skills-list.ts` (`owner/repo@skill`) and install through `host.installSkills`. MCP source of truth is `home/.config/mcp/mcp.json`; OpenCode `mcp` key is a generated mirror.
- Merge API Keys into `/etc/environment`; leave unrelated lines. Progress Log never contains values. Do not commit keys or `auth.json`.
- git package only. pi config minus model and extensions. Workflow is CONTEXT.md's list (no nvim/tmux/Android). OpenCode-local skills stay off the `home/` tree.
- `dotfiles sync` is `git pull --ff-only`, Stow, MCP mirror.
