# 03: Sync report and `sync --dry-run`

**What to build:** Real `dotfiles sync` still pulls `--ff-only`, Stows (no PATH relink), and refreshes OpenCode MCP — and now includes the Stow report in stdout with the existing sync summary. A failed pull still exits before Stow and before a report. `dotfiles sync --dry-run` does not pull, does not Stow, does not write MCP, and prints the Stow report for the current tree (even if the repo would not fast-forward). README `stow` and `sync` mention `--dry-run`. Sync still never installs or upgrades tools.

**Blocked by:** 02: Stow report and `stow --dry-run`

**Status:** done

- [x] Real `dotfiles sync` pulls, Stows, prints the Stow report plus the existing sync summary, refreshes OpenCode MCP, and does not call Mise Tools or Upstream Installs
- [x] A failed pull exits non-zero, Stows nothing, and prints no Stow report
- [x] `dotfiles sync --dry-run` prints the Stow report, does not pull, does not write `$HOME` or OpenCode config, and does not fail on a dirty/diverged repo
- [x] `dotfiles sync --help` documents `--dry-run`
- [x] README command copy for `stow` and `sync` mentions `--dry-run` and the report
- [x] Behaviour is observed only through the CLI against a fake Host
