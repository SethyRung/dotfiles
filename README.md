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
7. [Environment variables & API Keys](#environment-variables--api-keys)
8. [Preset configuration (`dotfiles.json`)](#preset-configuration-dotfilesjson)
9. [Re-runs and safety](#re-runs-and-safety)
10. [Keeping machines in sync](#keeping-machines-in-sync)
11. [Troubleshooting](#troubleshooting)
12. [Scope and limitations](#scope-and-limitations)

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
  [\]    Mise Tools       agy, bun, codex, gh, grok, herdr, node, opencode, pi
  [--]   pi packages      8 packages
  [--]   Zed              latest
  [--]   Skills           16 skills
  [--]   MCP              pi + OpenCode
  [--]   API Keys         will prompt
  [--]   Ghostty          will prompt
  [--]   login shell      zsh
  [--]   dotfiles CLI     ~/.local/bin
  --------------------------------------------
  step 6/14 - 42s elapsed
```

## What Bootstrap installs

| Category            | Contents                                                                                                                                                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Distro packages     | zsh, git, stow via the Package Map — no git config; optional Ghostty as `ghostty` on apt, pacman, dnf, and zypper                                                                                                                                                 |
| Upstream Installs   | mise, Oh My Zsh, OMZ plugins, Zed (always latest, never version-pinned)                                                                                                                                                                                           |
| Mise Tools          | agy, bun, Codex, gh, grok, herdr, pi, OpenCode (`latest`) and Node (`lts`) from the Stowed mise config; npm comes from mise's Node                                                                                                                                |
| pi packages         | Current pi plugins, installed only when pi was missing before Mise Tools                                                                                                                                                                                          |
| Stowed from `home/` | zshrc, zsh completions, mise config.toml, herdr config.toml, OpenCode config + TUI files, Grok config, Codex config + herdr hooks, pi agent config, Zed settings.json + keymap.json (Zed extensions are declared in `auto_install_extensions`, never snapshotted) |
| Machine state       | login shell becomes zsh, dotfiles symlinked into `~/.local/bin`, environment variables merged into chosen store location (`/etc/environment`, `~/.zshenv`, etc.)                                                                                                  |

Skills, pi packages, OMZ plugins, distro packages, and MCP are configured in `dotfiles.json`. Regular files at the destination are timestamp-backed-up then replaced; repo links are left; stale symlinks are replaced.

## Command reference

Usage: `dotfiles <command>` — with no arguments, the CLI prints its help. `dotfiles --version` prints the committed package version.

### `dotfiles init`

Bootstrap the Workflow, guided by the live Progress Log.

Runs all 14 steps: Distro packages, Oh My Zsh + plugins, mise, Stow, Mise Tools, pi packages, Zed, Skills, MCP (pi, OpenCode, Grok, and Codex translations), API Keys, optional Ghostty, login shell, and the `~/.local/bin/dotfiles` symlink. zsh TAB-completes `dotfiles` after Stow (fpath is set in the curated zshrc before Oh My Zsh).

```bash
dotfiles init
dotfiles init --yes
```

`--yes` answers continue, uses `.env` as-is (or skips keys), writes to the default store, skips Ghostty unless the Preset enables it, overwrites Stow conflicts, and does not reboot.

See [Re-runs and safety](#re-runs-and-safety) for repeat-run behavior, and [API Keys](#api-keys) for the key prompt.

### `dotfiles doctor`

Report every Workflow piece present or missing.

- Never prints API Key values.
- Reports Ghostty as an **optional** warning, not a failure.
- Lists broken Stow links.

```bash
dotfiles doctor
dotfiles doctor --json
```

`--json` prints Workflow Health as JSON (same exit code as the dashboard; API Key names only).

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
dotfiles clean --yes
```

`--yes` deletes Stow backups without a confirm prompt.

### `dotfiles sync`

Sync config: `git pull --ff-only`, re-Stow `home/`, refresh MCP translations. Prints the Stow report along with the sync summary.

Use `--dry-run` to preview the Stow report without pulling or writing.

Never installs or upgrades tools — presence is `init`'s job, upgrades belong to each tool (ADR 0014, 0015). A dirty or diverged repo fails fast before anything is Stowed.

```bash
dotfiles sync
dotfiles sync --dry-run
```

## Environment variables & API Keys

API Keys and environment variables are never committed.

### 1. Input: `.env` or CSV

When reaching the environment step during `init`:

- **From `.env`**: If `.env` exists in the repository root, variables are loaded automatically. Variable names (never secret values) are displayed:
  ```text
  Loaded environment variables from .env:
    OPENAI_API_KEY, ANTHROPIC_API_KEY
  Do you want to modify it? [y/N]
  ```
  If modifying, choose **Override** (`o`) to replace with a new CSV or **Append** (`a`) to merge new key-value pairs into the loaded `.env`.
- **From CSV**: If no `.env` is present, it prompts for standard `key=value` CSV input (empty skips):
  ```text
  API Keys (key=value CSV, empty skips): OPENROUTER_API_KEY=abc,OPENAI_API_KEY=xyz
  ```

### 2. Store location

You are prompted to select where to write the environment variables (defaulting to `/etc/environment`):

```text
Store location:
1) /etc/environment (system-wide) [default]
2) ~/.zshenv
3) ~/.profile
4) Custom path
Select [1-4, default 1]:
```

- Writing to `/etc/environment` prompts for `sudo` and provides system-wide visibility.
- User files (`~/.zshenv`, `~/.profile`, custom paths) are written directly.
- Existing lines such as `PATH` stay untouched — variables are merged into the target file, never overwriting unrelated lines.
- Secret values are never printed to the screen, logged, or included in the Progress Log.

## Preset configuration (`dotfiles.json`)

The repository includes `dotfiles.json` as the single source of truth for tools, skills, and packages. You can customize this file in your fork/clone to tailor your workflow:

```json
{
  "$schema": "./schema/dotfiles.schema.json",
  "tools": {
    "ghostty": false,
    "zed": true,
    "piPackages": true,
    "skills": true,
    "omzPlugins": true
  },
  "skills": ["vercel-labs/skills@find-skills", "mattpocock/skills@implement"],
  "piPackages": ["npm:pi-subagents", "npm:pi-mcp-adapter"],
  "omzPlugins": ["zsh-autosuggestions", "zsh-syntax-highlighting"],
  "packages": {
    "apt": ["zsh", "git", "stow"],
    "pacman": ["zsh", "git", "stow"],
    "dnf": ["zsh", "git", "stow"],
    "zypper": ["zsh", "git", "stow"]
  },
  "mcp": {
    "bun": { "url": "https://bun.com/docs/mcp" }
  }
}
```

- **`tools`**: Boolean toggles to enable or disable components (`ghostty`, `zed`, `skills`, `piPackages`, `omzPlugins`). Explicitly configured tools skip interactive prompts; omitted optional tools (such as Ghostty) prompt during setup.
- **`skills`**: Global agent skills installed via `skills.sh`.
- **`piPackages`**: Pi agent extensions installed when pi is set up.
- **`omzPlugins`**: Oh My Zsh plugins cloned into custom plugins.
- **`packages`**: Distro packages required by the workflow (distro-agnostic list or per-package-manager mapping).
- **`mcp`**: Canonical MCP servers. Bootstrap, Stow, and Sync translate this map into each agent's shape.
- **JSON Schema**: `schema/dotfiles.schema.json` provides validation and auto-completion in modern editors (Zed, VS Code, etc.).

## Re-runs and safety

- **Upfront questions**: All interactive questions (workflow continuation, API Keys/.env, unconfigured optional tools) are asked upfront so the installation runs in one continuous shot without intermediate pauses.
- Workflow already present: one `Continue? [y/N]` prompt. Decline changes nothing; continue skips installed tools quietly (`[skip] ... present`).
- Stow always re-links `home/`; Mise Tools always run `mise install` after that Stow (idempotent; not an upgrade).
- Extra prompts appear only before destructive writes: `/etc/environment` and Stow conflicts.
- Fail fast on required steps; Ghostty failure is a warning, not a crash.
- After changing the login shell, init offers a reboot (default no) — `zsh` or logging out/in also applies it.

## Keeping machines in sync

The maintainer edits config in this repo (anything under `home/`, `dotfiles.json`), commits, and pushes. On every Bootstrapped machine:

```bash
dotfiles sync
```

pulls the repo fast-forward only, re-Stows `home/` into `$HOME`, and refreshes MCP translations into pi and OpenCode.

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
