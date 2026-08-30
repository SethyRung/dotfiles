# 14: `dotfiles update` syncs config from the repo

**What to build:** a `dotfiles update` command for machines that already Bootstrapped: `git pull --ff-only` on this repo through the Host, then re-Stow `home/` into `$HOME`, then refresh the OpenCode MCP mirror from the XDG file. A pull failure (dirty tree, no remote, diverged history) fails fast with a non-zero exit before anything is Stowed. Update never installs or upgrades Workflow tools (ADR 0014). Help text describes update. Tests observe the pull, the re-Stow, the mirror refresh, and pull failure through the CLI against the fake Host.

**Blocked by:** 03: `dotfiles stow` backs up then links; 07: `dotfiles init` installs pi, Skills, and XDG MCP

**Status:** done

- [x] update pulls the repo with `--ff-only` before Stowing
- [x] update re-Stows the `home/` tree like `dotfiles stow`
- [x] update refreshes the OpenCode MCP mirror from the XDG file
- [x] A failed pull exits non-zero and Stows nothing
- [x] update requests no Upstream Installs, Distro packages, or tool upgrades
- [x] Help text describes update
- [x] Behaviour is observed only through the CLI against a fake Host
