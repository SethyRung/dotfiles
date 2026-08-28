# Agent notes

No CLI code yet. Do not invent a parallel design.

## Read first

- `CONTEXT.md` — glossary. Use those terms; do not say `dot` for the CLI.
- `docs/adr/` — binding. Especially: any Distro (0001), API Keys in `/etc/environment` (0002), TypeScript on bun + bash stub (0005), repo path is this directory not `~/.dotfiles` (0006), Skills via skills.sh and MCP is the XDG file (0007), no pi model restore (0008), command is `dotfiles` (0009).
- Spec: `docs/specs/dotfiles-cli-bootstrap.md`
- Tickets: `.scratch/dotfiles-cli-bootstrap/issues/`. Work the frontier (blockers done). Start at `01`.

## Implementation traps

- Inspired by dmmulroy/.dotfiles, but this is Linux: Package Map + Upstream Installs, not Homebrew. v1 commands are only `init`, `doctor`, `stow`.
- Tests go through the `dotfiles` CLI with a fake Host. No real apt, curl, sudo, or `/etc/environment` in tests. Do not unit-test internals.
- Never commit API Keys or `auth.json`. Merge keys into `/etc/environment`; do not replace the file; do not log values.
- git package only — no gitconfig. Ghostty is optional (prompt default no). Do not add nvim/tmux/Android or `dotfiles update`/`package`/`link`.
