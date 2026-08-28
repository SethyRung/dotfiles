# 03: `dotfiles stow` backup-then-link

**What to build:** `dotfiles stow` delivers the single `home/` tree into `$HOME` with Stow. If a target already exists, it is moved to a timestamped backup, then linked. herdr logs and sockets are not part of `home/` and are never linked.

**Blocked by:** 01: `dotfiles` CLI with fake Host and bun stub

**Status:** ready-for-agent

- [ ] `dotfiles stow` on a clean fake `$HOME` links the `home/` tree
- [ ] When a target file already exists, a timestamped backup is created and Stow then links
- [ ] herdr logs and sockets are not linked
- [ ] Behaviour is observed only through the CLI against a fake Host
