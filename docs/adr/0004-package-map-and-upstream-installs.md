# Distro via Package Map; CLI binaries via mise; the rest via Upstream Install

`dotfiles` installs zsh/git/stow/Ghostty through a Package Map so any Distro works. bun, Node, herdr, pi, and OpenCode are Mise Tools (ADR 0016), not Distro packages and not official curl-pipes. What remains as Upstream Install is mise itself, Oh My Zsh, OMZ plugins, and Zed. Mixing the three is deliberate: one file for Distro package names, one Stowed mise.toml for Mise Tools, no fake Distro packages for GitHub-only apps. Node.js is mise `lts`, not Distro npm and not nvm (ADR 0013 superseded).
