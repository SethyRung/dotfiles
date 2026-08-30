# 09: `dotfiles init` optional Ghostty

**What to build:** init asks `Install Ghostty? [y/N]` whenever Ghostty is missing, including on re-runs. No (default) skips package and config. Yes installs via Package Map and Stows Ghostty config. Already-installed Ghostty is not offered again but its config is still Stowed. If the Distro has no Ghostty Package Map entry, init warns and continues; doctor can later show Ghostty as missing.

**Blocked by:** 03: `dotfiles stow` backup-then-link; 04: `dotfiles init` Distro packages via Package Map

**Status:** done

- [x] Default / no skips Ghostty package and config
- [x] Yes on a Distro with a mapping installs Ghostty and Stows its config
- [x] Yes on a Distro without a mapping warns and does not abort the rest of init
- [x] The offer appears on re-runs too whenever Ghostty is missing
- [x] Already-installed Ghostty is not offered again; its config is still Stowed
- [x] Behaviour is observed only through the CLI against a fake Host
