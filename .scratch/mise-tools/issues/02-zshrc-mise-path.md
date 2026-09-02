# 02: curated zshrc lets mise own PATH

**What to build:** The Stowed zshrc activates mise with `eval "$(mise activate zsh)"` (no username-hardcoded path), after Oh My Zsh is sourced. OMZ `nvm` is gone. bun.com, herdr install-dir, and OpenCode bin PATH exports are gone. `~/.local/bin` stays on PATH so `mise` and `dotfiles` still resolve. Leftover `~/.bun` / `~/.nvm` directories are not deleted.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Curated zshrc activates mise without a hardcoded home path
- [ ] OMZ plugin list does not include nvm
- [ ] zshrc does not prepend bun.com, herdr install-dir, or OpenCode bin PATH
- [ ] zshrc still puts `~/.local/bin` on PATH
- [ ] Init does not delete leftover `~/.bun` or `~/.nvm`
- [ ] Behaviour is observed only through the CLI against a fake Host
