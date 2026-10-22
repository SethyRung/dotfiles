# Generated MCP and system prompt files are created, not Stowed

Pi `~/.pi/agent/mcp.json`, Cursor `~/.cursor/mcp.json`, and the system prompt destinations are generated output. Bootstrap, Stow, and Sync create each one when it is missing, then refresh its generated contents. They are not files under `home/`. Stow does not back them up.

OpenCode, Grok, and Codex configs stay curated Stow files. A missing one is not invented; the mirror only fills the MCP key when the file already exists. `mcp-adapter.json` is still not a dest and not a migration source.

Supersedes ADR 0029 (home templates and the Stow-path gate) and the "missing dests are not invented" rule in ADR 0027 and ADR 0028 for pi's `mcp.json`.
