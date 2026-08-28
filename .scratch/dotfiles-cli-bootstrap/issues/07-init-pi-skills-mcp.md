# 07: `dotfiles init` installs pi, Skills, and XDG MCP

**What to build:** init installs latest pi (bun global coding-agent), installs the current pi package list, restores settings without default model/provider, restores APPEND_SYSTEM, prompts, and extensions, reinstalls Skills via skills.sh from the repo lock/list, and Stows XDG `mcp.json`. auth, sessions, caches, and model stores are never restored.

**Blocked by:** 03: `dotfiles stow` backup-then-link; 04: `dotfiles init` Distro packages via Package Map

**Status:** ready-for-agent

- [ ] Init requests latest pi and the agreed pi packages on the Host
- [ ] Restored pi settings do not include default model or provider
- [ ] APPEND_SYSTEM, prompts, and extensions are restored; auth, sessions, caches, and model stores are not
- [ ] Skills are requested via skills.sh, not by snapshotting skill files as the install mechanism
- [ ] XDG MCP config is Stowed
- [ ] Behaviour is observed only through the CLI against a fake Host
