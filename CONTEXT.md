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
The Linux distribution Bootstrap runs on. Bootstrap detects the package manager. Unknown Distro fails before any install.
_Avoid_: OS, flavor, platform

**Workflow**:
The development environment Bootstrap restores: zsh, Oh My Zsh, Mise Tools, pi packages, Zed, Skills, MCP, API Keys, optional Ghostty, and git with no git config. Inventory is `dotfiles.json`, `src/consts/`, and `home/`.
_Avoid_: using "dotfiles" for the running environment

**Workflow Health**:
What `dotfiles doctor` reports and `dotfiles init` uses to detect a re-run.
_Avoid_: status check, doctor check, system test (when you mean this evaluation)

**Dotfiles**:
This repository: the `dotfiles` CLI plus the config files Bootstrap applies.
_Avoid_: using "dotfiles" for secrets or for software packages

**dotfiles** (CLI):
The CLI in this repo. `dotfiles init` runs Bootstrap.
_Avoid_: dot, install.sh, bootstrap.sh, script (as the user-facing name)

**Progress Log**:
The live dashboard init draws through the Host while Bootstrap runs. Redraws in place on a terminal; plain lines when piped. Never contains API Key values.
_Avoid_: verbose flag, debug logging, static log lines (when you mean the dashboard)

**Stow**:
How `dotfiles` delivers `home/` into `$HOME`. Command is `dotfiles stow`.
_Avoid_: copy, symlink (when you mean this delivery), GNU Stow exec, repair

**Sync**:
Re-apply this repo's config on an already-Bootstrapped machine. Command is `dotfiles sync`. Never installs or upgrades Workflow tools.
_Avoid_: update, upgrade, refresh (when you mean this command), tool update

**Package Map**:
Distro package names per package manager. A missing optional mapping warns and continues.
_Avoid_: Brewfile, bundle

**Upstream Install**:
Install from the project's own script or binary, not the Distro and not mise.
_Avoid_: curl-pipe, bootstrap script (when you mean this class of install)

**Mise Tool**:
A Workflow binary mise installs and versions as a global tool. Not a Distro package and not an Upstream Install.
_Avoid_: runtime, asdf tool, plugin, nvm

**OMZ plugin**:
A zsh plugin git-cloned into Oh My Zsh's custom plugins directory. Not a Mise Tool.
_Avoid_: plugin (unqualified), mise plugin

**pi**:
A coding agent in the Workflow: Mise Tool, packages, and Stowed config.

**OpenCode**:
A coding agent in the Workflow: Mise Tool plus Stowed config.
_Avoid_: opencode dotfiles, SST OpenCode

**Grok**:
A coding agent in the Workflow: Mise Tool (`npm:@xai-official/grok`) plus Stowed config.

**Codex**:
A coding agent in the Workflow: Mise Tool plus Stowed config and herdr hooks.

**Zed**:
The IDE in the Workflow: Upstream Install plus Stowed settings and keymap. Extensions are declared in `auto_install_extensions`.
_Avoid_: zed dotfiles, editor bundle

**Skill**:
An agent skill installed globally for pi and other agents to load.
_Avoid_: plugin, prompt, instruction file

**MCP**:
A Model Context Protocol server. The Workflow list is the Preset `mcp` key; each agent gets a translated copy.
_Avoid_: tool server, plugin, XDG mcp.json as source of truth, hand-maintained per-agent lists

**API Key**:
A secret environment variable needed by AI tools. Supplied during Bootstrap. Never stored in the repo.
_Avoid_: token, credential (when you mean these env vars)

**Preset**:
`dotfiles.json` in the repo root. Defaults and upfront questions for Bootstrap and doctor: tools, skills, pi packages, OMZ plugins, distro packages, and MCP.
_Avoid_: settings.json (when you mean this file)
