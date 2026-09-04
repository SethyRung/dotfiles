# 01: Per-command help and reject extra argv

**What to build:** Every command honors `--help` / `-h` and prints that command's help without doing the command's work. `dotfiles init --help` must not Bootstrap. Unknown flags and extra positional arguments exit non-zero with no Host writes. Top-level help (no args, `-h`, `--help`) still lists only `init`, `doctor`, `stow`, `clean`, and `sync`. If a help flag is present, help wins over other argv.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `dotfiles init --help` and `dotfiles init -h` print init help, exit 0, and perform no Bootstrap (no packages, Upstream Installs, Stow, or prompts)
- [ ] `doctor`, `stow`, `clean`, and `sync` each print their own help on `--help` / `-h` and do no work
- [ ] `--help` together with other argv still prints help and does no work
- [ ] An unknown flag or extra positional on any command exits 1, writes nothing on the fake Host, and does not run the command
- [ ] Top-level help still lists `init`, `doctor`, `stow`, `clean`, and `sync`, and does not mention `update`, `repair`, `package`, or `link`
- [ ] `--dry-run` is not implemented yet; `stow --dry-run` without `--help` is rejected as unknown
- [ ] Behaviour is observed only through the CLI against a fake Host
