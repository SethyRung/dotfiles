# 02: Doctor MCP vs Preset

**What to build:** Doctor’s MCP required row is `[ok]` only when pi, OpenCode, Grok, and Codex dests exist and match the Preset `mcp` translations. A missing dest or stale servers is `[!!]` and fails required Workflow. Doctor does not write agent configs. Init continue? still omits MCP dests. One MCP row, not four.

**Blocked by:** 01: Doctor expected API Key names

**Status:** done

- [x] All four agent dests exist and match Preset translations → `[ok]  MCP` and a otherwise-healthy Host can exit 0
- [x] Any dest missing → `[!!]  MCP`, required fail, exit 1
- [x] Dest present but servers differ from Preset (stale, extra, or missing servers) → `[!!]  MCP`, required fail, exit 1
- [x] Doctor does not create or rewrite agent MCP configs
- [x] Init continue? (`isBootstrapped`) still ignores MCP dests and the PATH symlink
- [x] Init/stow/sync MCP writes are unchanged
- [x] README doctor copy mentions MCP vs Preset
- [x] Behaviour is observed only through the CLI against a fake Host
