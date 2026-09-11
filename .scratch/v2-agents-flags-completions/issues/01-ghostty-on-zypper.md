# 01: Ghostty on zypper

**What to build:** Answering yes to Ghostty on zypper installs the Distro package `ghostty` and Stows its config, matching apt/pacman/dnf. Decline still skips both package and config. Missing Ghostty stays a doctor warning, not a required failure. Prompt default remains no.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Yes on zypper requests Distro package `ghostty` and Stows Ghostty config
- [x] Decline on zypper installs no Ghostty package and does not Stow Ghostty config
- [x] apt, pacman, and dnf Ghostty mappings stay `ghostty`
- [x] Doctor still treats missing Ghostty as optional, including on zypper
- [x] Ghostty prompt default remains no
- [x] Behaviour is observed only through the CLI against a fake Host
