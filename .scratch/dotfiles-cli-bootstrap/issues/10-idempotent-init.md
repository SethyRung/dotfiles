# 10: `dotfiles init` is idempotent

**What to build:** Re-running init on a Host that already looks like the Workflow asks a single continue? prompt first. Decline exits with no Host changes. Continue skips already-installed tools quietly and prompts again only for destructive writes: API Keys into `/etc/environment`, and Stow conflicts.

**Blocked by:** 05: `dotfiles init` installs the zsh Workflow; 06: `dotfiles init` installs herdr; 07: `dotfiles init` installs pi, Skills, and XDG MCP; 08: `dotfiles init` merges API Keys into `/etc/environment`; 09: `dotfiles init` optional Ghostty

**Status:** ready-for-agent

- [ ] When Workflow already looks present, init asks continue? before doing work
- [ ] Decline leaves the Host unchanged
- [ ] Continue does not re-request tools the Host already has
- [ ] Continue still confirms before `/etc/environment` writes and Stow conflicts
- [ ] Behaviour is observed only through the CLI against a fake Host
