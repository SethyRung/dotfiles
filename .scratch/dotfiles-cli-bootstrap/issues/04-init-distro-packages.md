# 04: `dotfiles init` Distro packages via Package Map

**What to build:** `dotfiles init` detects the Distro package manager and installs zsh, git, and stow from the Package Map (apt, pacman, dnf, zypper). An unknown package manager fails before any install. git is installed with no git config written. Required step failure fails fast.

**Blocked by:** 01: `dotfiles` CLI with fake Host and bun stub

**Status:** done

- [x] On a Host with a known package manager, init requests zsh, git, and stow from the Package Map
- [x] On a Host with an unknown package manager, init fails before any package or Upstream Install
- [x] git config is not written
- [x] A failed required Distro package install fails the command
- [x] Behaviour is observed only through the CLI against a fake Host
