# OpenCode MCP is a mirror of the XDG file

OpenCode cannot read `~/.config/mcp/mcp.json`. The XDG file stays the only list (ADR 0007). Bootstrap writes a translated `mcp` key into OpenCode config so both agents see the same servers. A second hand-maintained OpenCode list was rejected because it would drift.
