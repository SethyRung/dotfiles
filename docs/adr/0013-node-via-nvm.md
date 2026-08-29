# Node.js via nvm when npm is missing

`pi install npm:…` shells out to npm. Bootstrap therefore Upstream-Installs nvm (official `install.sh`) and runs `nvm install --lts` when `npm` is missing. Distro npm was rejected: package names split across Distros and the version is not the one this Workflow uses. nvm is not a Distro package. Later shells load it through the Oh My Zsh `nvm` plugin already in the curated zshrc.
