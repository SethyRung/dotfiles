# MCP list lives in the Preset

The Workflow MCP list is the `mcp` key in `dotfiles.json`, not a separate repo file, not a Stowed XDG file, and not any agent's native config. Bootstrap, Stow, and Sync translate that list into each agent's shape (pi `~/.pi/agent/mcp.json`, OpenCode `mcp` key, Grok/Codex `mcp_servers`). A new agent is one more translator. A second file beside skills and pi packages was rejected because the lists would drift. Declared `mcp` replaces defaults, same as other Preset lists. Supersedes ADR 0019 (file path).
