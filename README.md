```text
██████╗  ██████╗ ████████╗███████╗██╗██╗     ███████╗███████╗
██╔══██╗██╔═══██╗╚══██╔══╝██╔════╝██║██║     ██╔════╝██╔════╝
██║  ██╗██║   ██║   ██║   █████╗  ██║██║     █████╗  ███████╗
██║  ██╗██║   ██║   ██║   ██╔══╝  ██║██║     ██╔══╝  ╚════██║
██████╔╝╚██████╔╝   ██║   ██║     ██║███████╗███████╗███████║
╚═════╝  ╚═════╝    ╚═╝   ╚═╝     ╚═╝╚══════╝╚══════╝╚══════╝
        personal linux bootstrap
```

One command takes a Fresh Install of Linux to the full dev Workflow: zsh + Oh My Zsh, git, Mise Tools (bun, Node, herdr, pi, OpenCode), Zed, Skills, MCP, API Keys, and optional Ghostty. Linux only — any Distro with apt, pacman, dnf, or zypper.

## Contents

1. [Requirements](#requirements)
2. [Quickstart](#quickstart)
3. [Architecture](#architecture)
4. [The Progress Log](#the-progress-log)
5. [What Bootstrap installs](#what-bootstrap-installs)
6. [Command reference](#command-reference)
   - [`dotfiles init`](#dotfiles-init)
   - [`dotfiles doctor`](#dotfiles-doctor)
   - [`dotfiles stow`](#dotfiles-stow)
   - [`dotfiles clean`](#dotfiles-clean)
   - [`dotfiles sync`](#dotfiles-sync)
7. [API Keys](#api-keys)
8. [Re-runs and safety](#re-runs-and-safety)
9. [Keeping machines in sync](#keeping-machines-in-sync)
10. [Troubleshooting](#troubleshooting)
11. [Scope and limitations](#scope-and-limitations)

## Requirements

| Requirement      | Detail                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Operating system | Linux with apt, pacman, dnf, or zypper                                                     |
| Internet access  | Needed for Upstream Installs (curl, GitHub releases) and Mise Tools                        |
| sudo             | Only for merging API Keys into `/etc/environment` (optional)                               |
| Everything else  | Installed by Bootstrap itself, including [mise](https://mise.run) and bun (as a Mise Tool) |

An unknown Distro — no apt, pacman, dnf, or zypper — fails **before** installing anything.

## Quickstart

```bash
git clone <this-repo>
./dotfiles init
```

From there:

- `init` symlinks `~/.local/bin/dotfiles`, so the command works from anywhere in a new zsh session.
- Re-run [`dotfiles doctor`](#dotfiles-doctor) at any time to verify the Workflow.

## Architecture

The `dotfiles` entrypoint is a bash stub that installs [mise](https://mise.run) then bun (via mise) when bun is missing, then runs the TypeScript CLI (`src/`). Bootstrap is a sequence of 14 steps, each a Distro package install via the Package Map, an Upstream Install, a Mise Tool install, a Stow delivery, or a machine-state change:

```text
./dotfiles ── bash stub ──▶ bun ──▶ src/main.ts ──▶ init | doctor | stow | clean | sync
```

Piped output falls back to plain `label: detail` lines; a terminal gets the live dashboard below.

## The Progress Log

A live ASCII dashboard redraws as each step runs:

```text
  --------------------------------------------
  [ok]   Distro packages  zsh, git, stow
  [ok]   Oh My Zsh        latest
  [ok]   OMZ plugins      autosuggestions, syntax-highlighting
  [ok]   mise             latest
  [ok]   Stow             linked
  [\]    Mise Tools       bun, herdr, node, opencode, pi
  [--]   pi packages      8 packages
  [--]   Zed              latest
  [--]   Skills           16 skills
  [--]   OpenCode MCP     mcp key
  [--]   API Keys         will prompt
  [--]   Ghostty          will prompt
  [--]   login shell      zsh
  [--]   dotfiles CLI     ~/.local/bin
  --------------------------------------------
  step 6/14 - 42s elapsed
```

## What Bootstrap installs

| Category            | Contents                                                                                                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Distro packages     | zsh, git, stow via the Package Map — no git config                                                                                                                                                                    |
| Upstream Installs   | mise, Oh My Zsh, OMZ plugins, Zed (always latest, never version-pinned)                                                                                                                                               |
| Mise Tools          | bun, herdr, pi, OpenCode, grok, codex (`latest`) and Node (`lts`) from the Stowed mise config; npm comes from mise's Node                                                                                             |
| pi packages         | Current pi plugins, installed only when pi was missing before Mise Tools                                                                                                                                              |
| Stowed from `home/` | zshrc, mise config.toml, herdr config.toml, XDG mcp.json, OpenCode config + TUI files, pi agent config, Zed settings.json + keymap.json (Zed extensions are declared in `auto_install_extensions`, never snapshotted) |
| Machine state       | login shell becomes zsh, dotfiles symlinked into `~/.local/bin`, API Keys merged into `/etc/environment`                                                                                                              |

Skills are installed globally via skills.sh from `src/consts/skills-list.ts`, not snapshotted. Regular files at the destination are timestamp-backed-up then replaced; repo links are left; stale symlinks are replaced.

## Command reference

Usage: `dotfiles <command>` — with no arguments, the CLI prints its help.

### `dotfiles init`

Bootstrap the Workflow, guided by the live Progress Log.

Runs all 14 steps: Distro packages, Oh My Zsh + plugins, mise, Stow, Mise Tools, pi packages, Zed, Skills, OpenCode MCP mirror, API Keys, optional Ghostty, login shell, and the `~/.local/bin/dotfiles` symlink.

```bash
dotfiles init
```

See [Re-runs and safety](#re-runs-and-safety) for repeat-run behavior, and [API Keys](#api-keys) for the key prompt.

### `dotfiles doctor`

Report every Workflow piece present or missing.

- Never prints API Key values.
- Reports Ghostty as an **optional** warning, not a failure.
- Lists broken Stow links.

```bash
dotfiles doctor
```

### `dotfiles stow`

Re-link `home/` into `$HOME` and `~/.local/bin/dotfiles`. Prints a report of linked, backed-up, and skipped destinations.

Use `--dry-run` to preview changes without modifying the filesystem. Use it after editing Stowed config, or after moving the repo (run from the **new** location). Re-running is idempotent — already-correct links are left alone.

```bash
dotfiles stow
dotfiles stow --dry-run
```

### `dotfiles clean`

Delete the timestamped Stow backups from `$HOME`. Lists them and asks first.

```bash
dotfiles clean
```

### `dotfiles sync`

Sync config: `git pull --ff-only`, re-Stow `home/`, refresh the OpenCode MCP mirror. Prints the Stow report along with the sync summary.

Use `--dry-run` to preview the Stow report without pulling or writing.

Never installs or upgrades tools — presence is `init`'s job, upgrades belong to each tool (ADR 0014, 0015). A dirty or diverged repo fails fast before anything is Stowed.

```bash
dotfiles sync
dotfiles sync --dry-run
```

## API Keys

API Keys are never committed. During `init`:

```text
API Keys (key=value CSV, empty skips): OPENROUTER_API_KEY=abc,OPENAI_API_KEY=xyz
```

Empty input skips the step. Otherwise confirm, then **merge** into `/etc/environment` (sudo, world-readable):

- Existing lines such as `PATH` stay untouched — the file is merged, never replaced.
- Values are never logged and never appear in the Progress Log.

## Re-runs and safety

- Workflow already present: one `Continue? [y/N]` prompt. Decline changes nothing; continue skips installed tools quietly (`[skip] ... present`).
- Stow always re-links `home/`; Mise Tools always run `mise install` after that Stow (idempotent; not an upgrade).
- Extra prompts appear only before destructive writes: `/etc/environment` and Stow conflicts.
- Fail fast on required steps; Ghostty failure is a warning, not a crash.
- After changing the login shell, init offers a reboot (default no) — `zsh` or logging out/in also applies it.

## Keeping machines in sync

The maintainer edits config in this repo (anything under `home/`, the XDG MCP file), commits, and pushes. On every Bootstrapped machine:

```bash
dotfiles sync
```

pulls the repo fast-forward only, re-Stows `home/` into `$HOME`, and refreshes the OpenCode MCP mirror.

## Troubleshooting

| Symptom                                                                           | Fix                                                                                                 |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Stow dests or `~/.local/bin/dotfiles` point at the old path after moving the repo | Run `./dotfiles stow` from the **new** location — it replaces the PATH symlink and re-Stows `home/` |
| Bootstrap stops with an unknown-Distro error                                      | No apt / pacman / dnf / zypper found; the Distro is unsupported. Nothing was installed              |
| Login shell did not change                                                        | Log out/in, run `zsh`, or reboot — init offers this with a default of no                            |
| Broken or missing config links                                                    | Run `dotfiles doctor` to list them, then `dotfiles stow` to re-link                                 |
| Old backup files cluttering `$HOME`                                               | Run `dotfiles clean` (it lists them and asks first)                                                 |

## Scope and limitations

Out of scope: macOS / Windows.
