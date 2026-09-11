# 02: `dotfiles --version`

**What to build:** Top-level `dotfiles --version` prints the committed package version, exits zero, and performs no Host work. Combined with top-level `--help` / `-h`, help wins. `--version` after a command is an unknown option (non-zero, no work). Top-level help documents `--version`. No `version` command.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `dotfiles --version` prints the committed package version, exits 0, and performs no Host writes or installs
- [x] Top-level `--help` / `-h` together with `--version` prints help and does no work
- [x] `--version` after a command exits 1 as an unknown option and does no work
- [x] Top-level help documents `--version` and still does not list `update`, `repair`, `package`, `link`, or `completions`
- [x] There is no `version` command
- [x] Behaviour is observed only through the CLI against a fake Host
