# `dotfiles` CLI Bootstrap for a Fresh Install Workflow

Status: drafted locally — this repo has no issue tracker yet. After `/setup-matt-pocock-skills`, publish this spec and apply `ready-for-agent`.

## Problem Statement

After a Fresh Install of Linux, restoring the development Workflow by hand is slow and easy to get wrong: zsh + Oh My Zsh, herdr, pi (packages and config), OpenCode, Zed, global Skills, MCP, API Keys, optional Ghostty, and git. The user wants one personal command that does that Bootstrap on any Distro, inspired by dmmulroy's `dot` CLI but named `dotfiles` because `dot` already exists on PATH.

## Solution

A `dotfiles` CLI in this Dotfiles repo. `dotfiles init` runs Bootstrap, `dotfiles doctor` reports missing Workflow pieces, `dotfiles stow` re-links config from `home/` into `$HOME`, `dotfiles clean` deletes the timestamped Stow backups left in `$HOME`, and `dotfiles update` syncs config from the repo to an already-Bootstrapped machine. Distro packages come from a Package Map; Oh My Zsh, bun, herdr, pi, OpenCode, and Zed are Upstream Installs (always latest). Config is delivered with Stow. API Keys are typed in at Bootstrap as `key=value` pairs and merged into `/etc/environment` (never committed). The repo lives at `~/Documents/projects/personal/dotfiles` and is public.

## User Stories

1. As a developer on a Fresh Install, I want to run `dotfiles init` so that the Workflow is restored without remembering each tool.
2. As a developer on a Fresh Install with no bun, I want a bash stub to install bun via `curl -fsSL https://bun.com/install | bash` so that the TypeScript CLI can run.
3. As a developer who already has bun, I want the stub to skip bun install so that init is not slower than it needs to be.
4. As a developer, I want the user-facing command to be `dotfiles`, not `dot`, so that it does not collide with an existing PATH command.
5. As a developer, I want `dotfiles init`, `dotfiles doctor`, and `dotfiles stow` in v1 so that I can Bootstrap, check, and re-link without extra commands.
6. As a developer on any Linux Distro, I want Distro packages resolved through a Package Map (apt, pacman, dnf, zypper) so that Bootstrap is not Ubuntu-only.
7. As a developer on a Distro whose package manager is not in the Package Map, I want a clear failure before any partial install so that I am not left half-bootstrapped.
8. As a developer, I want zsh, git, and stow installed as Distro packages so that the rest of Bootstrap has a shell, git, and Stow.
9. As a developer, I want git installed with no git config written so that identity and credentials are never part of Dotfiles.
10. As a developer, I want Oh My Zsh installed via its official Upstream Install so that the curated zshrc has Oh My Zsh to source.
11. As a developer, I want a curated zshrc Stowed so that theme bira, current Oh My Zsh plugins, and PATH for bun, herdr, and `~/.local/bin` appear on a Fresh Install.
12. As a developer, I do not want Android SDK paths or extra tool aliases in that zshrc so that v1 stays the agreed Workflow.
13. As a developer, I want the login shell changed to zsh so that new terminals use the Workflow by default.
14. As a developer, I want herdr installed via `curl -fsSL https://herdr.dev/install.sh | sh` so that the binary is an Upstream Install, not a Distro package.
15. As a developer, I want herdr `config.toml` Stowed so that prefix, theme, and UI prefs match this machine.
16. As a developer, I do not want herdr logs or sockets in the repo so that secrets and junk never get committed.
17. As a developer, I want pi installed as the latest bun global coding-agent package so that the agent exists after bun.
18. As a developer, I want the current pi package list installed (subagents, mcp-adapter, ask-user-question, todo, retry, zentui, herdr, ollama web search) so that MCP and herdr integration work. npm comes from nvm (latest LTS) when missing, not a Distro package.
19. As a developer, I want pi `settings.json` restored without default model or provider so that TUI prefs return but the Fresh Install keeps pi's default model.
20. As a developer, I want `APPEND_SYSTEM.md` and `prompts/` restored so that pi's local behaviour matches this machine minus model.
21. As a developer, I do not want `auth.json`, sessions, caches, model stores, or auto-generated `extensions/` in the repo so that secrets, machine state, and herdr/moshi-hook output stay off git.
22. As a developer, I want Skills reinstalled via skills.sh from a list/lock in the repo so that global Skills are current, not a frozen file snapshot.
23. As a developer, I want `~/.config/mcp/mcp.json` Stowed (including mobile-mcp) so that MCP is the XDG file, not pi's private mcp.json.
24. As a developer, I want to be prompted for API Keys as `key1=value1,key2=value2,...` so that secrets are supplied at Bootstrap and never stored in Dotfiles.
25. As a developer, I want those keys merged into `/etc/environment` so that every process on the machine sees them, not only the shell.
26. As a developer, I want existing PATH and other lines in `/etc/environment` left alone so that a re-run does not wipe Distro environment.
27. As a developer who submits an empty API Key prompt, I want that step skipped so that I can Bootstrap without secrets.
28. As a developer, I want a confirmation before writing `/etc/environment` so that the sudo and world-readable cost is explicit.
29. As a developer, I want Ghostty offered with default no so that it stays optional.
30. As a developer who answers yes to Ghostty, I want it installed via the Package Map and its config Stowed so that the terminal matches this machine.
31. As a developer who answers no to Ghostty, I want both the package and the config skipped so that a Fresh Install is not forced into Ghostty.
32. As a developer who answers yes on a Distro with no Ghostty Package Map entry, I want a warning and a non-zero doctor later, not a crash, so that the rest of Workflow still installs.
33. As a developer, I want `dotfiles` symlinked to `~/.local/bin/dotfiles` during init so that `dotfiles doctor` and `dotfiles stow` work from any directory.
34. As a developer whose `~/.local/bin` is not yet on PATH in the current bash session, I still want init to succeed so that the next zsh session finds `dotfiles`.
35. As a developer re-running `dotfiles init` on a machine that already has the Workflow, I want a single "continue?" prompt so that I do not accidentally redo Bootstrap.
36. As a developer who declines that prompt, I want init to exit without changing the machine.
37. As a developer who continues, I want already-installed tools skipped quietly so that re-runs are not noisy.
38. As a developer, I want a further prompt only for destructive writes (API Keys into `/etc/environment`, Stow conflicts) so that I am asked before overwrite, not before every skip.
39. As a developer, I want existing target files backed up with a timestamp and then Stowed so that I can recover from Stow.
40. As a developer, I want `dotfiles stow` to apply the same backup-then-Stow rule so that I can re-link configs without running full init.
41. As a developer, I want Upstream Installs to always take latest so that v1 does not maintain version pins.
42. As a developer, I want `dotfiles doctor` to report whether zsh, Oh My Zsh, OMZ plugins, git, stow, npm, bun, pi, herdr, OpenCode, Zed, Skills, XDG MCP, login shell, and the `dotfiles` PATH symlink are present so that I can see what Bootstrap missed.
43. As a developer, I want doctor to treat Ghostty as a warning when missing unless I opted in, so that optional software is not a hard failure.
44. As a developer, I want doctor to report broken Stow links so that a half-linked `home/` is visible.
45. As a developer, I want doctor to report whether expected API Key names exist in `/etc/environment` without printing values so that I can check secrets without leaking them.
46. As a developer cloning on a Fresh Install, I want the repo path to be `~/Documents/projects/personal/dotfiles` so that development and Bootstrap share one location.
47. As a developer, I want clone to create the parent directories if needed so that a Fresh Install without a Documents tree still works.
48. As a developer, I want init to fail fast on a failed required step so that I am not left unsure what installed.
49. As a developer, I want no API Keys, credentials, or tokens in the public repo so that the repo can stay public.
50. As a developer reading `dotfiles --help` (or equivalent), I want init, doctor, and stow described so that I do not need the README to discover commands.
51. As a developer, I want Stow to use a single `home/` tree so that configs are obvious and match the inspiration layout.
52. As a developer on this Yoga 9, I want init to be safe to test so that I do not have to wait for the next Fresh Install to find bugs.
53. As an implementer, I want all of the above observable through the `dotfiles` CLI against a fake Host so that tests do not need real apt, curl, or sudo.
54. As a developer, I want Zed installed via its official Upstream Install (`https://zed.dev/install.sh`) so that the IDE is on a Fresh Install without a Distro package.
55. As a developer, I want Zed `settings.json` and `keymap.json` Stowed so that the IDE matches this machine on a Fresh Install.
56. As a developer, I want Zed extensions declared in `auto_install_extensions` in settings.json so that Zed installs them itself on first start and no extension snapshot is committed.
57. As a developer watching init run, I want a live ASCII dashboard of each step so that I can see where Bootstrap is, what it skipped, and how long it took.
58. As a developer, I want zsh-autosuggestions and zsh-syntax-highlighting cloned into Oh My Zsh's custom plugins when missing so that the curated zshrc loads without plugin warnings.
59. As a developer re-running init on a machine without Ghostty, I want the Ghostty offer anyway so that I can opt in later, not never.
60. As a developer with leftover timestamped backups from Stow conflicts, I want `dotfiles clean` to list and delete them after a confirmation prompt so that `$HOME` does not accumulate clutter.
61. As a user whose maintainer pushed new config to the repo, I want `dotfiles update` to pull the repo and re-Stow so that my machine's config matches the repo without re-running Bootstrap.
62. As a developer re-running `dotfiles stow` or `dotfiles update` on a Bootstrapped machine, I want existing symlinks into the repo refreshed without timestamped backups so that re-runs do not litter `$HOME` with stamps.

## Implementation Decisions

- Respect ADRs 0001–0013 and the glossary in `CONTEXT.md`. Command name is `dotfiles`. Distro support is any Linux via Package Map. API Keys go to `/etc/environment` with merge. CLI is TypeScript on bun with a bash stub. Repo path is `~/Documents/projects/personal/dotfiles`. Skills via skills.sh; MCP is the XDG file. pi config is snapshotted minus model and minus auto-generated extensions. Upstream Installs are latest. Node.js is nvm + latest LTS when npm is missing.
- One user-facing module: the `dotfiles` CLI. Commands in v1: `init`, `doctor`, `stow`, `clean`, `update`. No `package`, `link`, or completions.
- A Host boundary sits behind the CLI: filesystem, Distro package manager, Upstream Install runner, sudo, login-shell change, reboot, progress log, PATH symlink. Production Host talks to the real machine. Tests inject a fake Host. This is the only new seam.
- `commandExists` means installed: found on PATH or in the Workflow bin dirs (`~/.bun/bin`, `~/.local/bin`, `~/.opencode/bin`, nvm's `node/*/bin`) that the curated zshrc puts on PATH, so a bash session that has not re-sourced its rc still skips re-installs.
- Package Map is data: tool → package name per package-manager family (apt, pacman, dnf, zypper). Detect the family from the machine. Unknown family: fail before installs.
- Distro packages in v1: zsh, git, stow. Ghostty is optional and Package Map-backed. Missing Ghostty mapping: warn, do not abort the rest of init. Nothing installed is requested again when it already exists; Ghostty's config is still Stowed.
- Upstream Installs in v1: bun (`https://bun.com/install`), Oh My Zsh (official install script), zsh-autosuggestions and zsh-syntax-highlighting (git clone into `~/.oh-my-zsh/custom/plugins/` when missing), herdr (`https://herdr.dev/install.sh`), OpenCode (`https://opencode.ai/install`), zed (`https://zed.dev/install.sh`), nvm (official install.sh, then `nvm install --lts` if npm is missing), pi (bun global coding-agent, latest), Skills (skills.sh from the repo's lock/list).
- pi packages to install: the current list (pi-subagents, pi-mcp-adapter, ask-user-question, todo, pi-retry, pi-zentui, pi-herdr, ollama web search). Restore settings without default model/provider; restore APPEND_SYSTEM and prompts. Never restore auth, sessions, caches, model stores, or auto-generated extensions.
- Stow delivers: curated zshrc, herdr config.toml only, XDG mcp.json, OpenCode config and TUI files, Zed settings.json and keymap.json, Ghostty config only if Ghostty was requested, pi files listed above that belong in the home tree. Single `home/` tree. Conflict: timestamped backup, then Stow; a dest that already symlinks into the repo tree is re-linked without a backup.
- `dotfiles clean` finds backups by scanning stowed destinations for the backup stamp suffix, asks `Delete N Stow backup file(s)? [y/N]` (default no), and removes them through the Host. No backups: no-op, exit 0.
- `dotfiles update` syncs config only (ADR 0014): `git pull --ff-only` on this repo, then Stow, then the OpenCode MCP mirror refresh. It never installs or upgrades tools; a dirty, remote-less, or diverged repo fails fast with a non-zero exit before anything is Stowed. Tool upgrades stay with each tool's own self-update.
- Init interaction: if Workflow already looks present, one continue? prompt. Destructive prompts only for `/etc/environment` writes and Stow conflicts. Ghostty: `Install Ghostty? [y/N]` whenever it is missing, including on re-runs; already-installed Ghostty is not offered again but its config is still Stowed. API Keys: CSV prompt; empty skips.
- `/etc/environment` write uses sudo, merges keys, does not replace the file. Values never logged.
- After successful init, symlink the bash stub to `~/.local/bin/dotfiles`. Curated zshrc puts `~/.local/bin` on PATH.
- chsh to zsh as part of init (not optional). After the rest of init succeeds (only when the shell actually changed), show `Login shell is now zsh. Run `zsh`or`reboot` to fully apply the change.` then ask `Reboot to apply it? [y/N] ` (default no). Yes: reboot via sudo after all work is done. No: nothing further.
- Fail fast on required step failure. Optional Ghostty failure is a warning.
- Init reports progress through the Host as an ASCII dashboard: ANSI Shadow block banner and `Distro: <pm>` title once, one row per step with `[ok] [skip] [!!] [--]` cells and a spinning cell for the running step, `step n/15 - Ns elapsed` footer, `Bootstrap complete.` when done. Redrawn in place on a TTY; plain `label: detail` lines when piped; prompts and noisy commands (apt, sudo, chsh) print below the panel, which then reprints fresh. API Key values never appear.
- Tests never hit real package managers, real network, or real `/etc/environment`.

## Testing Decisions

- Good tests assert external behaviour only: CLI exit code, user-visible output, and Host effects (files written, packages requested, Upstream Installs invoked, sudo used, shell changed, backups created, progress log lines recorded). No tests of private helpers, Package Map parsing in isolation, or Stow flags in isolation.
- The only module under test is the `dotfiles` CLI, with a fake Host injected at the Host seam. Cover init (fresh, idempotent continue/decline, API Key merge, Ghostty yes/no, unknown Distro), doctor (missing vs present, no secret leakage), and stow (backup-then-link, skip junk files), and clean (no-op, confirm deletes, decline keeps files), and update (pull then re-Stow, mirror refresh, pull failure exits non-zero).
- Prior art: none. Greenfield repo.

## Out of Scope

- nvim, tmux, docker, Android SDK, and the rest of the Yoga 9 toolchain
- git config, git identity, GitHub SSH
- Naming the CLI `dot`
- `dotfiles update` in the **tool-upgrade** sense (brew/mas-style) — rejected by ADR 0014; `update` exists only as config sync
- `package add/remove`, completions, `link` as a separate command
- Pinning Upstream Install versions
- Snapshotting Skill files instead of skills.sh
- Using `~/.pi/agent/mcp.json` as the MCP source of truth
- Restoring pi default model/provider
- Restoring auto-generated pi extensions
- Replacing `/etc/environment` wholesale, or storing API Keys in a user-owned file
- Ubuntu-only or Nix/Homebrew as the package strategy
- chezmoi, copying files instead of Stow
- macOS / Windows
- Work vs personal bundles
- Publishing the GitHub repo itself (public is the intent; creating the remote is not this spec)

## Further Notes

- Inspiration: https://github.com/dmmulroy/.dotfiles — same CLI+Stow idea, Linux Workflow, different command name and package story.
- Paper trail already in-repo: `CONTEXT.md`, `docs/adr/0001`–`0009`.
- This spec is not yet on an issue tracker. Run `/setup-matt-pocock-skills` so `to-spec` can publish it with `ready-for-agent`.
