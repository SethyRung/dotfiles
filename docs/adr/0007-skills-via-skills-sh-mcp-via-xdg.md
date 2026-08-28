# Skills reinstall via skills.sh; MCP is the XDG file

Skills are not snapshotted. `dot init` reinstalls them with skills.sh (from a lock/list in the repo). MCP is the file `~/.config/mcp/mcp.json`, shipped in `home/` and Stowed — not `~/.pi/agent/mcp.json`. pi is expected to pick up that XDG config (today via `pi-mcp-adapter`).
