# Agent notes

v1 Bootstrap CLI is done. Extend `src/cli.ts` + Host; do not invent a parallel command or design.

## Read first

- `CONTEXT.md` — glossary. Use those terms; never call the CLI `dot`.
- `docs/adr/` — binding. Especially: any Distro (0001), API Keys merge into `/etc/environment` (0002), TypeScript on bun + bash stub (0005), repo is this directory not `~/.dotfiles` (0006), Skills via skills.sh / MCP is the XDG file (0007), no pi model restore (0008), command is `dotfiles` (0009), no pi extensions (0012), Node.js via mise not nvm (0013 superseded by 0016), config sync is `sync` not `update` (0015).
- Specs (done): `docs/specs/dotfiles-cli-bootstrap.md`, `docs/specs/opencode-in-workflow.md`. Tickets in `.scratch/dotfiles-cli-bootstrap/issues/` are historical — do not reopen unless asked.

## Commands

```
bun run lint && bun run fmt:check && bun run typecheck && bun test
```

- One test: `bun test -t "substring"` (cases live in `tests/commands/` and `tests/cli.test.ts`).
- Lint is oxlint (`typescript`; `@typescript-eslint/no-explicit-any` is **off**). Format is oxfmt (2-space, semicolons, double quotes, trailing commas, printWidth 100). oxfmt ignores `home/`.
- Imports: `@/` → `src/`, keep `.ts` extensions (`verbatimModuleSyntax`).

## Architecture

- `./dotfiles` (bash stub; chicken-eggs mise then bun if bun is missing) → `src/main.ts` → `run(args, host)` in `src/cli.ts`.
- Host (`src/types/host.ts`) is the only seam. Production: `unixHost`. Tests call `run()` with `createFakeHost` — never exec `./dotfiles`, never hit real apt, curl, sudo, or `/etc/environment`. Do not unit-test internals.
- v1 commands: `init`, `doctor`, `stow`, `clean`, `sync`. No `package`, `link`, `update`, or `repair`.

## Traps

- Linux Package Map + Upstream Installs, not Homebrew. Distro packages: zsh, git, stow. Unknown Distro fails before any install. Ghostty is optional (prompt default no; no zypper mapping — warn, don't abort).
- `commandExists` also looks in `~/.local/bin` and mise install dirs/shims, so a bash session without the curated PATH still sees Mise Tools. It does not treat leftover `~/.bun`, `~/.nvm`, or `~/.opencode/bin` as installed.
- `host.stow()` is direct `home/` → `$HOME` symlinks, not a GNU `stow` spawn. Existing repo/stale symlinks are replaced with no backup; regular files get a `YYYY-MM-DD_HH:mm:ss` stamp then link.
- Skills: `npx skills add https://github.com/<repo> --skill <name> --global --agent universal -y` from `src/consts/skills-list.ts` (`owner/repo@skill`), not a file snapshot. MCP source of truth is `home/.config/mcp/mcp.json`; OpenCode `mcp` key is a generated mirror — do not hand-maintain a second list.
- Never commit API Keys or `auth.json`. Merge keys into `/etc/environment`; do not replace the file; do not log values.
- git package only — no gitconfig. Do not restore pi default model/provider or `extensions/`. Do not add nvim/tmux/Android or snapshot OpenCode-local skills.
- `dotfiles sync` is config sync only (`git pull --ff-only`, Stow, MCP mirror) — never tool upgrades.
