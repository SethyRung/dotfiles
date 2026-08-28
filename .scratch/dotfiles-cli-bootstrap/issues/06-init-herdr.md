# 06: `dotfiles init` installs herdr

**What to build:** init installs herdr via its official Upstream Install and Stows `config.toml` only (prefix, theme, UI prefs). Logs and sockets stay off the tree.

**Blocked by:** 03: `dotfiles stow` backup-then-link; 04: `dotfiles init` Distro packages via Package Map

**Status:** ready-for-agent

- [ ] Init requests the herdr Upstream Install on the Host
- [ ] herdr `config.toml` is Stowed into the fake `$HOME`
- [ ] herdr logs and sockets are not Stowed
- [ ] Behaviour is observed only through the CLI against a fake Host
