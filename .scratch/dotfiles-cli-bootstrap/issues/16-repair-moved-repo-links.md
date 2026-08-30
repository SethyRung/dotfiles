# 16: `dotfiles stow` retargets PATH and Stow links

**What to build:** `linkDotfiles` and Stow must replace an existing dest (including a dangling or stale symlink) instead of throwing `EEXIST`. `dotfiles stow` relinks `~/.local/bin/dotfiles` to this stub, then re-Stows `home/` into `$HOME`. Stale dests that still resolve to an old path are replaced without timestamped backups; real files keep the backup-then-Stow rule. After the repo moves, run `./dotfiles stow` from the new location. No separate `repair` command. Tests observe PATH relink, re-Stow, stale-link replace, and no tool/pull requests through the CLI against the fake Host.

**Blocked by:** 01: `dotfiles` CLI with fake Host and bun stub; 03: `dotfiles stow` backs up then links; 15: re-Stow is idempotent

**Status:** done

- [x] Init replaces an existing `~/.local/bin/dotfiles` dest (no `EEXIST`)
- [x] `dotfiles stow` relinks the PATH stub even when a dest already exists
- [x] Stale dests that still resolve to an old path are replaced with no backup
- [x] Stow requests no Upstream Installs, Distro packages, or repo pull
- [x] Help text has no `repair` command
- [x] Behaviour is observed only through the CLI against the fake Host
