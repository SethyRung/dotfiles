# 07: `dotfiles init` installs pi, Skills, and XDG MCP

**What to build:** init installs latest pi (bun global coding-agent), installs the current pi package list, restores settings without default model/provider, restores APPEND_SYSTEM and prompts, reinstalls Skills via skills.sh from the repo lock/list, and Stows XDG `mcp.json`. auth, sessions, caches, model stores, and auto-generated extensions are never restored.

**Blocked by:** 03: `dotfiles stow` backup-then-link; 04: `dotfiles init` Distro packages via Package Map

**Status:** done

- [x] Init requests latest pi and the agreed pi packages on the Host
- [x] Restored pi settings do not include default model or provider
- [x] APPEND_SYSTEM and prompts are restored; extensions, auth, sessions, caches, and model stores are not
- [x] Skills are requested via skills.sh, not by snapshotting skill files as the install mechanism
- [x] XDG MCP config is Stowed
- [x] Behaviour is observed only through the CLI against a fake Host
