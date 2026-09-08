# MCP is a repo file; agents get translated copies

The Workflow MCP list is `src/consts/mcp.json`, not a Stowed XDG file and not any agent's native config. Bootstrap, Stow, and Sync translate that list into each agent's shape (pi `~/.pi/agent/mcp.json`, OpenCode `mcp` key). A new agent is one more translator. Hand-maintained per-agent lists and Stowing `~/.config/mcp/mcp.json` were rejected because they drift. Supersedes ADR 0007 (MCP path) and ADR 0010 (XDG as the only list).
