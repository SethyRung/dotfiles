# pi MCP mirror is native mcp.json

Pi 1.0 reads user MCP from `~/.pi/agent/mcp.json`. An installed `pi-mcp-adapter` replaces that built-in and ignores `mcp.json`. Bootstrap, Stow, and Sync write the Preset translation to `mcp.json`. `pi-mcp-adapter` is not a Workflow package.

If `mcp.json` is missing and `mcp-adapter.json` exists, mirror moves the adapter file, then writes. An existing `mcp.json` is not replaced by the adapter file. Empty or missing dests are still not invented. The `mcpServers` shape is unchanged.

Extends ADR 0026 (later number wins).
