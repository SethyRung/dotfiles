# pi MCP mirror is mcp-adapter.json

pi-mcp-adapter 3.0 stopped reading `~/.pi/agent/mcp.json`. That path is reserved for Pi's built-in MCP. The adapter reads `~/.pi/agent/mcp-adapter.json`. The `mcpServers` shape is unchanged.

Bootstrap, Stow, and Sync write the Preset translation there. If that file is missing and the legacy `mcp.json` exists, mirror moves it, then writes. A legacy file is left alone when `mcp-adapter.json` is already present, so a future Pi-owned `mcp.json` is not deleted. Empty or missing dests are still not invented.

Extends ADR 0022 (later number wins).
