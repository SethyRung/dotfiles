# Dotfiles

Personal Linux Bootstrap for restoring a development Workflow after a Fresh Install.

## Language

**Bootstrap**:
The process this repo runs to take a Fresh Install to a working Workflow.
_Avoid_: setup, provisioning, ricing

**Fresh Install**:
A newly installed Linux Distro with no prior personal config.
_Avoid_: clean machine, new box, blank laptop

**Distro**:
The Linux distribution Bootstrap runs on. Not Ubuntu-only; Bootstrap detects the package manager.
_Avoid_: OS, flavor, platform

**Workflow**:
The development environment Bootstrap restores: zsh + Oh My Zsh, herdr, pi plus its current packages, OpenCode, Zed, global Skills (via skills.sh), XDG MCP, API Keys, optional Ghostty, and git installed with no git config.
_Avoid_: using "dotfiles" for the running environment

**Dotfiles**:
This repository: the `dotfiles` CLI plus the config files Bootstrap applies.
_Avoid_: using "dotfiles" for secrets or for software packages

**dotfiles** (CLI):
The CLI in this repo. `dotfiles init` runs Bootstrap. Not `dot` — that command already exists on PATH.
_Avoid_: dot, install.sh, bootstrap.sh, script (as the user-facing name)

**Progress Log**:
The live ASCII dashboard init draws through the Host while Bootstrap runs: ANSI block banner, one row per step with `[ok]`/`[skip]`/`[!!]`/spinner cells, redrawn in place on a terminal, plain lines when piped. Never contains API Key values.
_Avoid_: verbose flag, debug logging, static log lines (when you mean the dashboard)

**Stow**:
GNU Stow; how `dotfiles` delivers config files from `home/` into `$HOME`.
_Avoid_: copy, symlink (when you mean this delivery)

**Update**:
Syncing config from this repo to an already-Bootstrapped machine: `git pull --ff-only`, then Stow, then the OpenCode MCP mirror refresh. Never installs or upgrades Workflow tools.
_Avoid_: upgrade, refresh (when you mean this sync), tool update

**Package Map**:
The file that names Distro packages per package manager (apt, pacman, dnf, zypper).
_Avoid_: Brewfile, bundle

**Upstream Install**:
Install from the project's own script or binary (curl, GitHub release), not the Distro. Oh My Zsh, its zsh plugins, herdr, bun, pi, OpenCode, and Zed are Upstream Installs.
_Avoid_: curl-pipe, bootstrap script (when you mean this class of install)

**OpenCode**:
A coding agent in the Workflow, restored by Bootstrap like pi: Upstream Install plus Stowed config.
_Avoid_: opencode dotfiles, SST OpenCode

**Zed**:
The IDE in the Workflow, restored like OpenCode: Upstream Install plus Stowed settings and keymap. Extensions are declared in `auto_install_extensions`, never snapshotted.
_Avoid_: zed dotfiles, editor bundle

**Skill**:
An agent skill installed globally for pi and other agents to load.
_Avoid_: plugin, prompt, instruction file

**MCP**:
A Model Context Protocol server. The Workflow's list is the XDG file; OpenCode is given the same servers via a mirrored `mcp` key.
_Avoid_: tool server, plugin, pi-private mcp.json as source of truth

**API Key**:
A secret environment variable needed by AI tools. Supplied during Bootstrap as `key=value` pairs, written to `/etc/environment`, never stored in the repo.
_Avoid_: token, credential (when you mean these env vars)
