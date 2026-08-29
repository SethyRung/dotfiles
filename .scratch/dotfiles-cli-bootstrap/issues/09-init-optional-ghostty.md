# 09: `dotfiles init` optional Ghostty

**What to build:** init asks `Install Ghostty? [y/N]`. No (default) skips package and config. Yes installs via Package Map and Stows Ghostty config. If the Distro has no Ghostty Package Map entry, init warns and continues; doctor can later show Ghostty as missing.

**Blocked by:** 03: `dotfiles stow` backup-then-link; 04: `dotfiles init` Distro packages via Package Map

**Status:** done

- [x] Default / no skips Ghostty package and config
- [x] Yes on a Distro with a mapping installs Ghostty and Stows its config
- [x] Yes on a Distro without a mapping warns and does not abort the rest of init
- [x] Behaviour is observed only through the CLI against a fake Host
