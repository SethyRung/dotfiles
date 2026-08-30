# `dotfiles update` syncs config; it does not upgrade tools

v1 excluded `dotfiles update` (spec Out of Scope) because the inspiration's `dot update` means tool upgrades (brew/mas), and this domain has no version state: `commandExists` is boolean and Upstream Installs take latest at install time, so "update what is outdated" is not expressible without growing the Host seam.

The real need is config sync: the maintainer pushes config to the repo and a machine that already Bootstrapped pulls and re-applies it. Git carries the version state. `dotfiles update` is therefore `git pull --ff-only` on this repo, then Stow, then the OpenCode MCP mirror refresh. A dirty or diverged repo fails fast; missing tools stay `init`'s job; tool upgrades stay with each tool's own self-update. This reverses the v1 exclusion for a smaller semantic than the one that was rejected.
