# 07: zsh completions

**What to build:** A Stowed zsh completion function completes `dotfiles` to `init`, `doctor`, `stow`, `clean`, and `sync`, and completes the flags each command actually accepts (`--help`, `--dry-run`, `--yes`, `--json`, `--version` where those flags exist). Curated zshrc puts that completions directory on `fpath` before Oh My Zsh loads so a Fresh Install zsh session completes `dotfiles` with no extra setup. No `completions` command. No Fish or bash. Top-level help still omits `completions`.

**Blocked by:** 02: `dotfiles --version`; 03: `doctor --json`; 06: `init --yes` and `clean --yes`

**Status:** ready-for-agent

- [ ] Stowed zsh completion lists `init`, `doctor`, `stow`, `clean`, and `sync`
- [ ] Flag completion covers `--help`, `--dry-run`, `--yes`, `--json`, and `--version` only on the commands that accept them
- [ ] Curated zshrc prepends the completions directory to `fpath` before Oh My Zsh
- [ ] Top-level help does not list a `completions` command (nor `update`, `repair`, `package`, or `link`)
- [ ] README mentions `--yes`, `--json`, `--version`, zsh completions, Grok/Codex snapshot, and Ghostty on zypper
- [ ] Behaviour is observed only through the CLI against a fake Host
