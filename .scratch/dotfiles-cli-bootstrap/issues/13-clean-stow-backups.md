# 13: `dotfiles clean` deletes Stow backups

**What to build:** a `dotfiles clean` command that finds the timestamped backup files Bootstrap and `dotfiles stow` leave in `$HOME` (stowed paths suffixed with the backup stamp), asks `Delete N Stow backup file(s)? [y/N]` (default no), and removes them through the Host. No backups: report nothing to clean and exit 0. Help text describes clean. Tests observe the prompt, deletion, and decline through the CLI against the fake Host; no real `$HOME` files are touched.

**Blocked by:** 03: `dotfiles stow` backs up then links

**Status:** done

- [x] With no Stow backups, clean reports nothing to clean and exits 0
- [x] With backups, clean prompts `Delete N Stow backup file(s)? [y/N]` (default no)
- [x] Declined clean deletes nothing and exits 0
- [x] Confirmed clean removes each listed backup through the Host and reports them
- [x] Help text describes clean alongside init, doctor, and stow
- [x] Behaviour is observed only through the CLI against a fake Host
