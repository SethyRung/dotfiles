# Node.js via nvm when npm is missing

Superseded by ADR 0016. Node is a Mise Tool (`lts`); nvm is not installed.

Previously: `pi install npm:…` shells out to npm, so Bootstrap Upstream-Installed nvm and ran `nvm install --lts` when `npm` was missing. Distro npm was rejected: package names split across Distros and the version is not the one this Workflow uses. nvm is not a Distro package. Later shells loaded it through the Oh My Zsh `nvm` plugin already in the curated zshrc.
