# 05: `dotfiles init` installs the zsh Workflow

**What to build:** After Distro packages exist, init runs the Oh My Zsh Upstream Install, Stows a curated zshrc (bira, current plugins, PATH for bun/herdr/`~/.local/bin`, no Android SDK or extra tool aliases), changes the login shell to zsh, and symlinks the `dotfiles` stub into `~/.local/bin`. Init still succeeds if the current bash session cannot see that symlink yet.

**Blocked by:** 03: `dotfiles stow` backup-then-link; 04: `dotfiles init` Distro packages via Package Map

**Status:** done

- [x] Init requests the Oh My Zsh Upstream Install on the Host
- [x] A curated zshrc is Stowed without Android SDK paths or out-of-scope aliases
- [x] Login shell is changed to zsh
- [x] Reboot offer after the login-shell change: hint line (`zsh` or `reboot`) then `Reboot to apply it? [y/N]`, default no
- [x] `~/.local/bin/dotfiles` is a symlink to the stub
- [x] Init succeeds even when the current session PATH does not yet include `~/.local/bin`
- [x] Behaviour is observed only through the CLI against a fake Host
