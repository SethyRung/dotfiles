# 14: `dotfiles sync` syncs config from the repo

**What to build:** a `dotfiles sync` command for machines that already Bootstrapped: `git pull --ff-only` on this repo through the Host, then re-Stow `home/` into `$HOME`, then refresh the OpenCode MCP mirror from the XDG file. A pull failure (dirty tree, no remote, diverged history) fails fast with a non-zero exit before anything is Stowed. Sync never installs or upgrades Workflow tools (ADR 0014, 0015). Help text describes sync. Tests observe the pull, the re-Stow, the mirror refresh, and pull failure through the CLI against the fake Host. Command was first shipped as `update`; ADR 0015 renamed it to `sync`.

**Blocked by:** 03: `dotfiles stow` backs up then links; 07: `dotfiles init` installs pi, Skills, and XDG MCP

**Status:** done

- [x] sync pulls the repo with `--ff-only` before Stowing
- [x] sync re-Stows the `home/` tree like `dotfiles stow`
- [x] sync refreshes the OpenCode MCP mirror from the XDG file
- [x] A failed pull exits non-zero and Stows nothing
- [x] sync requests no Upstream Installs, Distro packages, or tool upgrades
- [x] Help text describes sync
- [x] Behaviour is observed only through the CLI against a fake Host
