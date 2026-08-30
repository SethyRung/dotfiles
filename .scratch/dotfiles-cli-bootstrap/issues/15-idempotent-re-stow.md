# 15: re-Stow is idempotent — no backup churn for repo links

**What to build:** `dotfiles stow` and `dotfiles sync` skip the timestamped backup when the destination already symlinks into this repo's `home/` tree (a new Host `linksIntoRepo` check) and just re-link. Real files at destinations keep the story-39 backup-then-Stow rule. Re-runs on a Bootstrapped machine leave zero stamp files in `$HOME`. Tests observe backups through the fake Host.

**Blocked by:** 03: `dotfiles stow` backs up then links; 14: `dotfiles sync` syncs config

**Status:** done

- [x] Re-Stowing a dest that already symlinks into the repo creates no backup
- [x] A real file at a dest still gets the timestamped backup
- [x] `dotfiles sync` on a Bootstrapped machine churns no backups
- [x] Behaviour is observed only through the CLI against a fake Host
