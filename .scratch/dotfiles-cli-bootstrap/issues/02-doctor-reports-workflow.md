# 02: `dotfiles doctor` reports Workflow

**What to build:** `dotfiles doctor` tells the user which Workflow pieces are present or missing: zsh, Oh My Zsh, git, stow, bun, pi, herdr, Skills, XDG MCP, login shell, and the `dotfiles` PATH symlink. Ghostty missing is a warning, not a hard failure, unless the user opted in. API Key names may be reported present/absent; values are never printed. Broken Stow links are visible.

**Blocked by:** 01: `dotfiles` CLI with fake Host and bun stub

**Status:** ready-for-agent

- [ ] On an empty Host, doctor reports the required Workflow pieces as missing and exits non-zero
- [ ] Ghostty missing is a warning, not a required failure
- [ ] Doctor never prints API Key values
- [ ] Broken Stow links are reported
- [ ] Behaviour is observed only through the CLI against a fake Host
