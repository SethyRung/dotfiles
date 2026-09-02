# 02: curated zshrc lets mise own PATH

**What to build:** The Stowed zshrc activates mise with `eval "$(mise activate zsh)"` (no username-hardcoded path), after Oh My Zsh is sourced. OMZ `nvm` is gone. bun.com, herdr install-dir, and OpenCode bin PATH exports are gone. `~/.local/bin` stays on PATH so `mise` and `dotfiles` still resolve. Leftover `~/.bun` / `~/.nvm` directories are not deleted.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Curated zshrc activates mise without a hardcoded home path
- [x] OMZ plugin list does not include nvm
- [x] zshrc does not prepend bun.com, herdr install-dir, or OpenCode bin PATH
- [x] zshrc still puts `~/.local/bin` on PATH
- [x] Init does not delete leftover `~/.bun` or `~/.nvm`
- [x] Behaviour is observed only through the CLI against a fake Host
