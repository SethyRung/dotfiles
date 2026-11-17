# Repository Guidelines

## Project Structure

`./dotfiles` launches the Bun TypeScript CLI. `run(args, host)` in `src/cli.ts` dispatches to
`src/commands/`. Route system I/O through `Host` (`src/types/host.ts`), implemented by `unixHost`
in `src/unix-host.ts`.

Use `CONTEXT.md` for domain terms and `docs/adr/` for binding decisions. The higher-numbered ADR
takes precedence when decisions conflict. Use active specs in `docs/specs/` for implementation
requirements. Specs marked `done` and `.scratch/` are historical.

## Configuration and Stow

Edit `dotfiles.json` for Preset values, including MCP and API Key names. Update
`schema/dotfiles.schema.json` when the Preset shape changes. Keep API Key values and `.env` local.
Edit `home/.config/mise/config.toml` for the Mise Tool inventory and `src/consts/system-prompt.md`
for shared agent instructions.

Stow delivers `home/` into `$HOME`. It skips links into the current `home/` tree, replaces foreign
symlinks, and backs up ordinary file conflicts with a `YYYY-MM-DD_HH:mm:ss` suffix before linking.
`src/utils/mcp.ts` applies the curated settings listed in `src/utils/stow.ts` over live configs.
Repo values win on shared keys, and live-only keys survive. Keep generated MCP files, shared system
prompt destinations, and tool-generated hooks out of `home/`.

## Development and Testing

Install dev dependencies with `bun install`. Run `./dotfiles --help` for the command list or
`./dotfiles stow --dry-run` to preview Stow changes.

```sh
bun run lint && bun run fmt:check && bun run typecheck && bun test
```

This runs Oxlint, Oxfmt, TypeScript, and Bun tests. Use `bun run fmt` to format. Use two-space
indentation and keep `.ts` import extensions (`@/` maps to `src/`).

Put command tests in `tests/commands/<command>.test.ts`. Name cases by behavior and drive them
through `run()` with `createFakeHost` from `tests/helpers/fake-host.ts`. Filter by test name with
`bun test -t "substring"`.

## Commits and Pull Requests

Use short imperative subjects such as `fix(clean): list backups before deletion confirmation`.
History uses `feat`, `fix`, and `chore` with optional scopes. Omit author trailers. In PRs, summarize
the behavior change, report verification, and link the related issue when available.
