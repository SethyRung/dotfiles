# 02: Extract `clean` command and test suite

**What to build:** Isolate the `dotfiles clean` command into its own command module and dedicated test suite. The CLI dispatcher routes the `clean` argument to this command, and all clean tests exercise behavior exclusively through the public `run(["clean"], host)` entry point.

**Blocked by:** 01: Extract test helpers and restore green test baseline

**Status:** ready-for-agent

- [ ] Clean command logic resides in its own command module under `src/commands/`
- [ ] Clean tests are moved to a dedicated test file under `tests/commands/`
- [ ] Clean tests invoke the CLI exclusively via `run(["clean"], host)`
- [ ] No prompt, confirmation, or backup deletion behavior regressions
- [ ] `bun test` passes
