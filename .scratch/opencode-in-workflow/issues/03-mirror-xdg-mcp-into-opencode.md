# 03: init mirrors XDG MCP into OpenCode

**What to build:** After init, OpenCode's `mcp` key lists the same servers as the XDG MCP file (translated into OpenCode's shape). The XDG file stays the only list. A re-run refreshes the mirror so the two views do not drift.

**Blocked by:** 02: Stow OpenCode config and put it on PATH

**Status:** done

- [x] After init, OpenCode's `mcp` key contains the XDG MCP servers
- [x] The XDG MCP file remains the source of truth (not a second hand-edited OpenCode list)
- [x] Re-running init refreshes OpenCode's `mcp` key from the XDG file
- [x] Behaviour is observed only through the CLI against a fake Host
