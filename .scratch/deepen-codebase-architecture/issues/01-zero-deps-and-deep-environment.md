# 01: Zero runtime dependencies & deep Environment seam

**What to build:** The `dotfiles` CLI runs with zero production dependencies in `package.json`. Backup stamping and timestamp validation use native runtime date handling, and tests use standard test-runner clock controls instead of an external date library. The Host seam encapsulates `/etc/environment` updates and key queries directly, so commands prompt for and apply API Keys without exposing raw file content across the seam.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `package.json` contains zero runtime dependencies, with `dayjs` completely removed.
- [ ] Stow backup filenames continue to use the exact `YYYY-MM-DD_HH:mm:ss` timestamp format, generated and validated via native ECMAScript date handling.
- [ ] The Host interface provides domain methods to merge API Keys into `/etc/environment` and list configured key names, eliminating raw file text reads and writes across the seam.
- [ ] In `dotfiles init`, entering API Keys as CSV pairs prompts for confirmation and merges them into `/etc/environment` without altering unrelated lines or comments.
- [ ] `dotfiles doctor` displays configured API Key names with `[ok]` status cells and never prints secret values.
- [ ] Test suites run with deterministic clock control via `bun:test` `setSystemTime()`, leaving the full test suite green without external date mocks.
