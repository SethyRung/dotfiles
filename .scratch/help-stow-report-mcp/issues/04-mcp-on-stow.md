# 04: MCP mirror on real `stow`

**What to build:** After a real `dotfiles stow`, OpenCode's `mcp` key is refreshed from the XDG MCP file so a local XDG edit does not need `dotfiles sync`'s pull or a full `init`. Dry-run does not write OpenCode config. A missing XDG file skips the mirror write. Init and Sync keep their existing MCP refresh steps. No new `mcp` command.

**Blocked by:** 02: Stow report and `stow --dry-run`

**Status:** ready-for-agent

- [ ] Real `dotfiles stow` writes OpenCode `mcp` from the XDG file after linking
- [ ] `dotfiles stow --dry-run` does not write OpenCode config
- [ ] Missing XDG MCP file skips the mirror write and does not invent OpenCode config
- [ ] `dotfiles init` still refreshes the mirror in its MCP step; real `dotfiles sync` still refreshes after Stow
- [ ] Help still has no `mcp` command
- [ ] Behaviour is observed only through the CLI against a fake Host
