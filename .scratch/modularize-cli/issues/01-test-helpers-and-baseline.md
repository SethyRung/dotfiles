# 01: Extract test helpers and restore green test baseline

**What to build:** Decouple test scaffolding from the monolithic test suite by moving fake Host construction, skill directory generation, progress inspection helpers, and zshrc reading into dedicated test helpers. Update the curated zshrc PATH test expectation to match the current zshrc configuration so the entire test suite passes cleanly before splitting commands.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Test helper modules provide `createFakeHost`, `skillDirs`, `finalSteps`, `frameStep`, and `readZshrc`
- [ ] Existing test suite imports and uses the shared test helpers without test duplication
- [ ] The curated zshrc PATH test accurately matches the configured PATH
- [ ] Entire test suite passes with `bun test`
