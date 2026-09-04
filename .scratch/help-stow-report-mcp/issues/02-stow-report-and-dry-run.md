# 02: Stow report and `stow --dry-run`

**What to build:** The Host Stow method returns a report of linked, backed-up, and skipped destinations and accepts a dry-run option that fills the same report without writing. Real `dotfiles stow` prints that report and still relinks the PATH stub. `dotfiles stow --dry-run` prints the same report and writes nothing (no symlinks, backups, or PATH stub). Init's Progress Log Stow row stays a single cell, not a file list. Collision, junk, and Ghostty rules stay as they are.

**Blocked by:** 01: Per-command help and reject extra argv

**Status:** ready-for-agent

- [ ] Host Stow returns `{ linked, backedUp, skipped }` and honors a dry-run option; production and fake Host use the same collision rules
- [ ] Real `dotfiles stow` prints the report, relinks `~/.local/bin/dotfiles`, backs up regular files with a `YYYY-MM-DD_HH:mm:ss` stamp, skips repo links, replaces stale/other symlinks without backup, and omits junk from the report
- [ ] `dotfiles stow --dry-run` prints the same kind of report (including dests that would be backed up) and creates no links, backups, or PATH stub rewrite
- [ ] `dotfiles stow --help` documents `--dry-run`; `--dry-run` on `init`, `doctor`, or `clean` is still unknown and fails closed
- [ ] `dotfiles init` Stow does not dump a file-by-file report on stdout; existing init tests stay green
- [ ] `dotfiles clean` still lists timestamped backups from real Stows
- [ ] Behaviour is observed only through the CLI against a fake Host
