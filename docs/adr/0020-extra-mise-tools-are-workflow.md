# Extra Mise Tools are required Workflow

ADR 0016 named five Mise Tools: bun, Node, herdr, pi, and OpenCode. The Stowed mise.toml already declares grok (`npm:@xai-official/grok`), Codex, gh, and agy. `mise install` therefore puts them on a Fresh Install, but doctor and continue? still treated only the original five as Workflow.

The Mise Tool list is the Stowed mise.toml. Those four are required Workflow, same class as bun and OpenCode, not Ghostty-optional. No new Upstream Installs. `dotfiles sync` still never upgrades tools (ADR 0015). Grok/Codex config snapshot and MCP translators stay a later v2 cut.
