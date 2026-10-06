# pi MCP mirror does not adopt mcp-adapter.json

`mcp-adapter.json` is not a dest and not a migration source. Mirror writes `~/.pi/agent/mcp.json` only when that file already exists. It does not move or delete `mcp-adapter.json`.

Extends ADR 0027 (later number wins).
