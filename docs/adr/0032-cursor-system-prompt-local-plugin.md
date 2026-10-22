# Cursor system prompt through a local plugin

`~/.cursor/rules/system-prompt.mdc` did not reliably deliver the shared prompt across projects in the Cursor editor and CLI. `alwaysApply` controls a discovered rule's application; it does not make a project rule directory a global source. Cursor's [rules documentation](https://cursor.com/docs/rules) describes `.cursor/rules` as project rules, not a global user-rule API.

Bootstrap, Stow, and Sync instead generate a real local plugin directory at `~/.cursor/plugins/local/dotfiles-system-prompt/`. Its `.cursor-plugin/plugin.json` declares the name `dotfiles-system-prompt` and a description. Its `rules/system-prompt.mdc` contains `alwaysApply: true` frontmatter followed by the shared Markdown. Both files are generated through the Host, created when missing, and refreshed without Stow templates. Pi, Codex, and MCP behavior are unchanged.

Cursor [documents local plugin discovery](https://cursor.com/docs/plugins#test-plugins-locally) and the [plugin manifest and rule format](https://cursor.com/docs/reference/plugins). Generate files inside the local plugin directory, rather than linking a repo outside it: Cursor rejects plugin directory symlinks resolving outside `~/.cursor/plugins/local`. Restart Cursor or reload its window and start a new conversation after applying changes; restart CLI sessions too. Confirm the rule in Customize. Enterprise policy must allow local plugin imports. An installed marketplace plugin with the same name takes precedence.

Remove the legacy `~/.cursor/rules/system-prompt.mdc` only when it exactly matches the current generated rule. Preserve edited or stale copies for manual review rather than deleting personal instructions. Missing shared source and dry runs do not create or remove prompt files.

Supersedes ADR 0030's system prompt destination and rejection of local plugins. Retains ADR 0031's generated-file delivery policy.
