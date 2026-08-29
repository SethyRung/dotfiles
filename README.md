```text
     _       _    __ _ _
  __| | ___ | |_ / _(_) | ___  ___
 / _` |/ _ \| __| |_| | |/ _ \/ __|
 | (_| | (_) | |_|  _| | |  __/\__ \
 \__,_|\___/ \__|_| |_|_|\___||___/
        personal linux bootstrap
```

One command takes a Fresh Install of Linux to the full dev Workflow: zsh + Oh My Zsh, herdr, pi, OpenCode, Zed, Skills, MCP, API Keys, optional Ghostty, and git (package only).

The command is `dotfiles`, not `dot`. Linux only (apt / pacman / dnf / zypper) — not Homebrew. The repo lives at `~/Documents/projects/personal/dotfiles`, not `~/.dotfiles`.

## Quickstart

```bash
mkdir -p ~/Documents/projects/personal
git clone <this-repo> ~/Documents/projects/personal/dotfiles
cd ~/Documents/projects/personal/dotfiles
./dotfiles init
```

A bash stub installs [bun](https://bun.com/install) if missing, then runs the TypeScript CLI. `init` later symlinks `~/.local/bin/dotfiles` so the command works from anywhere in a new zsh session. An unknown Distro (no apt / pacman / dnf / zypper) fails before installing anything.

## What init looks like

A live ASCII dashboard redraws as each step runs:

```text
  --------------------------------------------
  [ok]   Distro packages  zsh, git, stow
  [ok]   Oh My Zsh        latest
  [skip] nvm + Node LTS   npm present
  [ok]   herdr            latest
  [ok]   pi + packages    8 packages
  [ok]   OpenCode         latest
  [ok]   Zed              latest
  [ok]   Skills           14 skills
  [\]    Stow             home/ tree
  [--]   OpenCode MCP     mcp key
  [--]   API Keys         will prompt
  [--]   Ghostty          will prompt
  [--]   login shell      zsh
  [--]   dotfiles CLI     ~/.local/bin
  --------------------------------------------
  step 9/14 - 42s elapsed
```

Piped output falls back to plain `label: detail` lines.

## What gets installed

```text
  Distro packages ..... zsh, git, stow via the Package Map, no git config
  Upstream installs .. Oh My Zsh, herdr, pi + its packages, OpenCode, Zed,
                       nvm + Node LTS when npm is missing, Skills via
                       skills.sh (always latest, never version-pinned)
  Stowed from home/ .. zshrc, herdr config.toml, XDG mcp.json, OpenCode
                       config + TUI files, Zed settings.json + keymap.json
                       (Zed extensions are declared in auto_install_extensions,
                       never snapshotted)
  Machine state ...... login shell becomes zsh, dotfiles symlinked into
                       ~/.local/bin, API Keys merged into /etc/environment
```

Existing target files are backed up with a timestamp, then Stowed.

## Commands

| Command           | What it does                                                               |
| ----------------- | -------------------------------------------------------------------------- |
| `dotfiles init`   | Bootstrap the Workflow, guided by the live dashboard                       |
| `dotfiles doctor` | Report every Workflow piece present or missing                             |
| `dotfiles stow`   | Re-link `home/` into `$HOME` (timestamped backup if a file already exists) |

`doctor` never prints API Key values, reports Ghostty as an optional warning, and lists broken Stow links.

## API Keys

Never committed. During `init`:

```text
API Keys (key=value CSV, empty skips): OPENROUTER_API_KEY=abc,OPENAI_API_KEY=xyz
```

Empty skips. Otherwise confirm, then **merge** into `/etc/environment` (sudo, world-readable). Existing lines such as `PATH` stay. Values are never logged.

## Re-runs and safety

- Workflow already present: one `Continue? [y/N]` prompt. Decline changes nothing; continue skips installed tools quietly (`[skip] ... present`).
- Extra prompts only before destructive writes: `/etc/environment` and Stow conflicts.
- Fail fast on required steps; Ghostty failure is a warning, not a crash.
- After changing the login shell, init offers a reboot (default no) — `zsh` or log out/in also applies it.

## Out of scope

nvim, docker, macOS / Windows, `dotfiles update` / `package` / `link`.

## Docs

- [`CONTEXT.md`](./CONTEXT.md) — glossary
- [`docs/adr/`](./docs/adr/) — binding decisions
- [`docs/specs/`](./docs/specs/) — spec
- [`.scratch/`](./.scratch/) — tickets
- [`AGENTS.md`](./AGENTS.md) — notes for coding agents

The CLI is implemented and tested through a fake Host (`bun test`) — no test touches real apt, curl, sudo, or `/etc/environment`.
