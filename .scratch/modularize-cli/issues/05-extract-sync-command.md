# 05: Extract `sync` command and test suite

**What to build:** Isolate the `dotfiles sync` command into its own command module and dedicated test suite. The command coordinates repository pulling, re-stowing via the shared stow engine, and OpenCode MCP mirror refreshing. Sync tests move to a dedicated test file and invoke behavior via `run(["sync"], host)`.

**Blocked by:** 04: Extract shared `stow` engine and command

**Status:** done

- [x] Sync command logic resides in its own command module under `src/commands/`, consuming the shared stow engine
- [x] Sync tests are moved to a dedicated test file under `tests/commands/`
- [x] Sync tests invoke the CLI exclusively via `run(["sync"], host)`
- [x] Clean pull, fast-forward failure handling, stow backup rules, and MCP mirror refresh remain unchanged
- [x] `bun test` passes
