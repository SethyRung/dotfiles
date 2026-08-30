# Config sync command is `sync`, not `update`

ADR 0014 kept the config-sync command named `update`. That name still sounds like tool upgrades (`dot update`, brew/mas), which 0014 rejected. The command is `dotfiles sync`: `git pull --ff-only`, then Stow, then the OpenCode MCP mirror refresh. Same behaviour as 0014; different name so it cannot be read as a tool upgrade.
