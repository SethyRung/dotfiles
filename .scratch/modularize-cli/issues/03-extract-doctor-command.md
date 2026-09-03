# 03: Extract `doctor` command and test suite

**What to build:** Isolate the `dotfiles doctor` command into its own command module and dedicated test suite. The CLI dispatcher routes the `doctor` argument to this command, and all doctor tests exercise diagnostic behavior exclusively through `run(["doctor"], host)`.

**Blocked by:** 01: Extract test helpers and restore green test baseline

**Status:** ready-for-agent

- [ ] Doctor command logic and formatting helpers reside in their own command module under `src/commands/`
- [ ] Doctor tests are moved to a dedicated test file under `tests/commands/`
- [ ] Doctor tests invoke the CLI exclusively via `run(["doctor"], host)`
- [ ] All workflow diagnostics, optional tool warnings, broken stow link reporting, and exit code logic remain unchanged
- [ ] `bun test` passes
