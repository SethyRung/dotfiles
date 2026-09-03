# 07: Update documentation and verify full suite

**What to build:** Update repository agent documentation to reflect the new command and test structure, and verify that the entire codebase passes formatting, linting, type-checking, and test suites without errors.

**Blocked by:**

- 02: Extract `clean` command and test suite
- 03: Extract `doctor` command and test suite
- 05: Extract `sync` command and test suite
- 06: Extract `init` command and finalize dispatcher

**Status:** done

- [x] `AGENTS.md` test location reference updated to point to `tests/commands/`
- [x] `bun run lint` (oxlint) passes with zero warnings or errors
- [x] `bun run fmt:check` (oxfmt) passes
- [x] `bun run typecheck` passes
- [x] `bun test` passes across all test files
