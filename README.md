# Dotfiles

Personal Linux Bootstrap. After a Fresh Install, restore the development Workflow in one go: zsh + Oh My Zsh, herdr, pi, Skills, MCP, API Keys, optional Ghostty, and git (package only).

The command is `dotfiles`, not `dot`. Linux only (apt / pacman / dnf / zypper). Not Homebrew. Not `~/.dotfiles`.

**Status:** design is in `CONTEXT.md`, `docs/adr/`, and `docs/specs/`. The CLI is not implemented yet.

## Fresh Install

```bash
mkdir -p ~/Documents/projects/personal
git clone <this-repo> ~/Documents/projects/personal/dotfiles
cd ~/Documents/projects/personal/dotfiles
./dotfiles init
```

A bash stub installs [bun](https://bun.com/install) if missing, then runs the TypeScript CLI. `init` later symlinks `~/.local/bin/dotfiles` so the command works from anywhere after a new zsh session.

Unknown Distro (no apt/pacman/dnf/zypper) fails before installing anything.

## Commands

| Command           | What it does                                                               |
| ----------------- | -------------------------------------------------------------------------- |
| `dotfiles init`   | Bootstrap the Workflow                                                     |
| `dotfiles doctor` | Report what is present or missing                                          |
| `dotfiles stow`   | Re-link `home/` into `$HOME` (timestamped backup if a file already exists) |

No TUI. Prompts are stdin. v1 has no `update`, `package`, or `link`.

## What `init` installs

**Distro packages:** zsh, git, stow. No git config.

**Upstream Installs (always latest):** bun, Oh My Zsh, herdr, pi plus its packages, Skills via skills.sh.

**Stow from `home/`:** curated zshrc, herdr `config.toml` only, XDG MCP (`~/.config/mcp/mcp.json`), pi settings/prompts without default model or auto-generated extensions. Login shell becomes zsh.

**Ghostty:** optional. Prompt is `Install Ghostty? [y/N]`. No skips package and config. Yes on a Distro with no package mapping warns and continues.

Re-run: if the Workflow already looks present, one continue? Decline does nothing. Continue skips installed tools; extra confirms only before `/etc/environment` writes and Stow conflicts.

## API Keys

Never committed. During `init`:

```text
OPENROUTER_API_KEY=abc,OPENAI_API_KEY=xyz
```

Empty skips. Otherwise confirm, then **merge** into `/etc/environment` (sudo, world-readable). Other lines such as `PATH` stay. Values are not logged.

## Out of scope (v1)

nvim, tmux, docker, Android SDK, git identity, pi default model, macOS/Windows.

## Docs

- [`CONTEXT.md`](./CONTEXT.md) — glossary
- [`docs/adr/`](./docs/adr/) — decisions
- [`docs/specs/dotfiles-cli-bootstrap.md`](./docs/specs/dotfiles-cli-bootstrap.md) — spec
- [`AGENTS.md`](./AGENTS.md) — notes for coding agents
