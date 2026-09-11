# Agent notes

Extend `src/cli.ts` + Host. Commands: `init`, `doctor`, `stow`, `clean`, `sync`.

- `CONTEXT.md` — Language: Bootstrap, Workflow, Distro, Stow, Sync, Package Map, Upstream Install, Mise Tool, Skill, MCP, API Key, Preset.
- `docs/adr/` — binding; later number wins. Distro, Package Map, Upstream Install, Mise Tool, API Key, Skill, MCP, Sync, pi snapshot, OpenCode snapshot, Grok snapshot, Codex snapshot, Preset, repo location, CLI name, stub.
- `docs/specs/` — ready-for-agent. Status done and `.scratch/` are historical.

## Verify

```
bun run lint && bun run fmt:check && bun run typecheck && bun test
```

One test: `bun test -t "substring"`. Imports keep `.ts` extensions (`@/` → `src/`).

## Architecture

`run(args, host)` in `src/cli.ts`. Host (`src/types/host.ts`) is the only seam. Production: `unixHost`. Every test drives `run()` through `createFakeHost`.

`host.stowTree()` delivers `home/` → `$HOME`: repo links stay, stale/other symlinks are replaced, regular files get a `YYYY-MM-DD_HH:mm:ss` stamp then link.
