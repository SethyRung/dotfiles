# 04: Extract shared `stow` engine and command

**What to build:** Isolate file-linking stow engine and the `dotfiles stow` CLI command into a dedicated module. The module provides the core file-linking engine with options (for reuse by `init` and `sync`) and the CLI command handler which ensures dotfiles link creation before stowing. Stow tests move to a dedicated test file and invoke behavior via `run(["stow"], host)`.

**Blocked by:** 01: Extract test helpers and restore green test baseline

**Status:** done

- [x] Module under `src/commands/` exports the stow file-linking engine accepting options (filtering, conflicts, backups)
- [x] Module exports the stow command handler performing dotfiles symlinking and stowing
- [x] Stow tests are moved to a dedicated test file under `tests/commands/`
- [x] Stow tests invoke the CLI exclusively via `run(["stow"], host)`
- [x] Backup creation, symlink replacement, and junk filtering behaviors remain unchanged
- [x] `bun test` passes
