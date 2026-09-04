# Help, Stow report, and MCP on stow

Status: ready-for-agent

## Problem Statement

The `dotfiles` CLI ignores everything after the command name. `dotfiles init --help` runs Bootstrap. `dotfiles stow` succeeds with empty stdout, so the developer cannot see what was linked, backed up, or skipped, and cannot preview a Stow. Editing the Stowed XDG MCP file leaves OpenCode's `mcp` key stale until `dotfiles sync` (which also `git pull --ff-only`) or a full `dotfiles init`. The developer wants those gaps closed on the existing five commands, without a sixth command and without tool upgrades.

## Solution

Grow `init`, `doctor`, `stow`, `clean`, and `sync` in place. The dispatcher honors per-command `--help` / `-h` and rejects unknown extra argv before any work. The Host Stow method returns a report of linked, backed-up, and skipped destinations, optionally without writing (`--dry-run`). Real `dotfiles stow` and `dotfiles sync` print that report. `dotfiles stow` also refreshes the OpenCode MCP mirror from the XDG file after a real Stow, so a local MCP edit does not require Sync's pull.

## User Stories

1. As a developer, I want `dotfiles` with no arguments to print top-level help and exit zero so that usage is discoverable.
2. As a developer, I want `dotfiles --help` and `dotfiles -h` to print the same top-level help and exit zero so that common help flags work.
3. As a developer who types an unknown command, I want a non-zero exit with the error and help on stderr so that I can correct the invocation.
4. As a developer, I want `dotfiles init --help` to print init help and exit zero without Bootstrapping so that help cannot change the machine.
5. As a developer, I want `dotfiles init -h` to behave the same as `dotfiles init --help` so that the short flag is safe too.
6. As a developer, I want `dotfiles doctor --help`, `dotfiles stow --help`, `dotfiles clean --help`, and `dotfiles sync --help` to print that command's help and exit zero without doing the command's work.
7. As a developer who passes `--help` together with other flags, I want help to win and no work to run so that `dotfiles stow --dry-run --help` is still documentation.
8. As a developer who passes an unknown flag to any command, I want a non-zero exit and no Host writes so that `dotfiles init --please` cannot Bootstrap.
9. As a developer who passes extra positional arguments, I want a non-zero exit and no Host writes so that `dotfiles stow extra` does not silently Stow.
10. As a developer reading top-level help, I want the five commands `init`, `doctor`, `stow`, `clean`, and `sync` listed so that the surface stays the v1 set.
11. As a developer reading help, I do not want `update`, `repair`, `package`, or `link` listed so that rejected names stay gone.
12. As a developer reading `stow` help, I want `--dry-run` documented so that I can preview a Stow.
13. As a developer reading `sync` help, I want `--dry-run` documented so that I can preview Sync's Stow without pulling.
14. As a developer, I want the user-facing command to remain `dotfiles` so that it does not collide with `dot` on PATH.
15. As a developer running `dotfiles stow` on a clean `$HOME`, I want stdout to list the destinations that were linked so that success is not silent.
16. As a developer running `dotfiles stow` when a regular file already exists at a destination, I want that file timestamp-backed-up, then linked, and both actions visible in the report so that I can find the backup.
17. As a developer re-Stowing destinations that already link into the repo, I want those destinations reported as skipped, with no new backup, so that re-runs stay quiet and idempotent.
18. As a developer whose destination is a stale or foreign symlink, I want it replaced without a backup and reported as linked so that old links are cleaned up.
19. As a developer, I want junk (logs, sockets, caches, `auth.json`, OpenCode-local skills, pi `extensions/`) excluded from Stow and absent from the report so that secrets and ephemeral files never look delivered.
20. As a developer, I want Ghostty config included in `dotfiles stow` (full tree) so that today's Stow command is unchanged except for the report and MCP refresh.
21. As a developer, I want `dotfiles stow` to still relink `~/.local/bin/dotfiles` so that the command works after a repo move.
22. As a developer running `dotfiles stow --dry-run`, I want the same report I would get from a real Stow so that I can preview without writing.
23. As a developer running `dotfiles stow --dry-run`, I want no new symlinks, no backups, no PATH stub rewrite, and no OpenCode MCP write so that preview cannot change the machine.
24. As a developer running `dotfiles stow --dry-run` when a regular file would be backed up, I want that destination listed as backed-up in the report while the live file stays untouched so that the preview is honest.
25. As a developer running `dotfiles sync --dry-run`, I want no `git pull`, no Stow writes, and no MCP write so that preview cannot mutate the repo or `$HOME`.
26. As a developer running `dotfiles sync --dry-run`, I want the Stow report for the current `home/` tree (the Stow Sync would do: full tree, no PATH relink) so that I can see config apply without pulling.
27. As a developer running a real `dotfiles sync`, I want the pull to happen first, then Stow, then the MCP mirror, and I want the Stow report in stdout along with the existing sync summary so that I see both pull and Stow.
28. As a developer whose repo cannot fast-forward, I want `dotfiles sync` to fail before Stow and before printing a Stow report so that a dirty repo still fails fast.
29. As a developer running `dotfiles sync --dry-run` on a dirty repo, I want the dry-run to skip pull entirely (and therefore not fail on a dirty tree) so that I can still preview local Stow.
30. As a developer, I do not want `--dry-run` on `init`, `doctor`, or `clean` so that an unknown flag still fails closed.
31. As a developer running `dotfiles init`, I want the Progress Log Stow row to stay as it is today so that a file-by-file Stow report does not flood Bootstrap.
32. As a developer who edited the Stowed XDG MCP file, I want `dotfiles stow` to refresh OpenCode's `mcp` key from that file so that I do not need `dotfiles sync`'s pull or a full `init`.
33. As a developer running `dotfiles stow --dry-run`, I do not want OpenCode config rewritten so that preview cannot drift the mirror.
34. As a developer running `dotfiles init`, I want the existing OpenCode MCP step to keep refreshing the mirror so that Bootstrap still ends with a consistent `mcp` key.
35. As a developer running a real `dotfiles sync`, I want the existing MCP refresh after Stow to remain so that Sync still matches ADR 0015 (pull, Stow, MCP).
36. As a developer whose XDG MCP file is missing, I want `dotfiles stow` to skip the mirror write (same as today's helper) so that a partial tree does not invent OpenCode config.
37. As a developer, I do not want a new `mcp` command so that MCP stays a behavior of Stow / Sync / init.
38. As a developer, I do not want a second hand-maintained OpenCode MCP list so that the XDG file stays the only list (ADR 0010).
39. As a developer, I want production Host and fake Host to apply the same Stow collision rules, including dry-run, so that tests match the real machine.
40. As a developer running `dotfiles clean`, I want timestamped backups from real Stows still listed and deletable so that the report does not change backup naming.
41. As a developer, I want unknown Distro, Package Map, Mise Tools, and Sync-never-upgrades behavior unchanged so that this spec only grows help, report, dry-run, and MCP-on-stow.
42. As a developer writing tests, I want every new behavior observed through the CLI against a fake Host so that internals stay free to move.
43. As a developer piping `dotfiles stow --dry-run`, I want a plain report on stdout and exit zero when the preview succeeds so that I can script a no-op check.
44. As a developer who passes `--dry-run` to `stow` with no other extra args, I want exit zero when the preview succeeds so that a clean tree is not an error.
45. As a maintainer, I want README command copy for `stow` and `sync` to mention `--dry-run` and the report so that the user-facing doc matches the CLI.

## Implementation Decisions

- Host remains the only seam. Do not add a second interface, a parallel CLI, or a sixth command. Commands stay `init`, `doctor`, `stow`, `clean`, `sync`.
- The CLI dispatcher reads the command and any following argv. Known per-command flags: `-h` / `--help` on every command; `--dry-run` on `stow` and `sync` only. Unknown flags or extra positionals exit 1 with a short error (and help) on stderr and must not call command work.
- `--help` / `-h` after a command prints that command's help on stdout, exit 0, with no Host mutations. Combined with other flags, help wins.
- Top-level help (no args, `-h`, `--help`) stays the five-command list. It must not mention `update`, `repair`, `package`, or `link`. `stow` and `sync` help mention `--dry-run`.
- The Host Stow method grows a dry-run option and returns a report instead of void. Production and fake Host share the same collision rules already in force: repo links skipped, stale/other symlinks replaced without backup, regular files stamped `YYYY-MM-DD_HH:mm:ss` then linked, junk filtered, Ghostty skip/only filters unchanged.
- Report shape (decision, not a prototype): `{ linked, backedUp, skipped }` as destination path lists. Dry-run fills the same lists without writing.
- `dotfiles stow` (real): relink PATH stub, Stow the full tree, print the report, then refresh OpenCode MCP from XDG. `dotfiles stow --dry-run`: do not relink PATH, do not Stow, do not write MCP; print the report (PATH relink noted as something that would happen, without doing it).
- `dotfiles sync` (real): pull `--ff-only`, Stow (no PATH relink, matching today), print the report, refresh MCP, keep the existing sync summary. `dotfiles sync --dry-run`: no pull, no Stow writes, no MCP write; print the Stow report for the current tree.
- Init's inner Stow stays Progress-Log-only (no file-by-file report on stdout). Init keeps its own MCP step. Do not attach `--dry-run` to init, doctor, or clean.
- MCP refresh on `dotfiles stow` uses the existing XDG → OpenCode `mcp` key translation. Missing XDG file skips the write. No new Host methods for MCP (`readFile` / `writeFile` already exist).
- `--dry-run` is the long flag only (no `-n`) so short unknown flags stay rejected.
- Do not remove leftover Host progress-frame updates in this spec.
- `dotfiles sync` still never installs or upgrades tools.

## Testing Decisions

- Good tests assert CLI exit code, stdout/stderr, and fake Host effects only (links, backups, PATH stub, repo pulls, MCP file contents, packages, Upstream Installs, Mise Tools). No unit tests of flag parsers, report formatters, or Host adapters in isolation.
- The module under test is the `dotfiles` CLI via `run(args, fakeHost)`. Cover: top-level help unchanged; per-command `--help` / `-h` does no work (especially `init --help` must not install); unknown flags and extra argv exit 1 with no writes; `stow` prints a report and writes; `stow --dry-run` prints a report and writes nothing (including no MCP and no PATH stub); skip/backup/stale/junk still match existing Stow tests; `stow` refreshes OpenCode MCP on a real run; `sync --dry-run` does not pull and does not write; real `sync` still pulls, Stows, mirrors, and does not call Mise Tools; dirty-repo real sync still fails before Stow.
- Prior art: CLI help and unknown-command tests; Stow backup/skip/junk/PATH tests; Sync pull-then-Stow-then-MCP tests; init Progress Log tests (must stay green with no file-list dump).

## Out of Scope

- New commands (`mcp`, `package`, `update`, `repair`, `link`, `unlink`, `edit`, `mise`, `help` as a command)
- Completions
- `init --dry-run`, `init --yes` / non-interactive Bootstrap, `doctor --json`, `--version`
- Declared expected API Key name list; filtering `PATH` out of doctor
- `sync --no-pull` as a separate flag (MCP-on-stow plus `stow --dry-run` cover local apply/preview)
- Tool upgrades (`mise upgrade`, `pi update`, brew/mas-style `update`); renaming Sync
- Changing Stow collision/backup rules, junk filters, Ghostty filters, or backup stamp format except to return and print them
- Replacing Stow with chezmoi or GNU Stow exec
- Homebrew, Nix, macOS, Windows, nvim/tmux/Android, git config/SSH, work vs personal bundles
- Snapshotting Skill files, OpenCode-local skills, pi model/provider, pi `extensions/`
- A second OpenCode MCP list; using pi's MCP file as source of truth
- Cleaning leftover `Host.progress` or deleting leftover `~/.bun` / `~/.nvm`

## Further Notes

- Source: `.scratch/cli-features.md` (research). Recommended next four only; thinner and rejected items stay out of scope.
- Binding: ADR 0009 (command is `dotfiles`), ADR 0010 (XDG MCP, OpenCode `mcp` is a generated mirror), ADR 0015 (Sync is pull then Stow then MCP, never tool upgrades). Deepen spec is done; this spec lands the leftover Stow report as a user-facing flag, not a sixth command.
- Glossary: Bootstrap, Distro, Workflow, Stow, Sync, Package Map, Upstream Install, Mise Tool, Skill, MCP, API Key, Progress Log, Host.
- Seam: Host only. Tests call `run` with the fake Host. Confirmed: this repo's sole seam; dispatcher argv is not a second seam.
- Tracker for this repo is `docs/specs/` (no `docs/agents/issue-tracker.md`). Status `ready-for-agent` is the triage label. `/to-tickets` can split next.
