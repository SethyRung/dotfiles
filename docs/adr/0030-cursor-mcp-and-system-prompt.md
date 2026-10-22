# Cursor MCP and system prompt adapters

Cursor's global MCP file is `~/.cursor/mcp.json`. It uses the same `mcpServers` shape as pi (`url`, or `command` plus `args`). Bootstrap, Stow, and Sync merge the Preset translation into that key and leave other keys in place. A missing file is created. It is not a Stow template.

The shared system prompt is an always-applied user rule at `~/.cursor/rules/system-prompt.mdc`. Cursor includes a rule with `alwaysApply: true` in every Agent conversation. The rule body is the shared Markdown. The adapter adds only that frontmatter and creates the file when it is missing. Cloud User Rules and `~/.cursor/plugins/local` were rejected: User Rules are account state, and Cursor skips a plugin symlink whose target sits outside `~/.cursor/plugins/local`.

Extends ADR 0022 and ADR 0029.
