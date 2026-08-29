# 12: `dotfiles init` shows a live Progress Log

**What to build:** init reports each step to a live ASCII dashboard through the Host: ANSI Shadow block banner and `Distro: <pm>` title once, one row per step — `[ok]` done, `[skip]` present/declined, `[!!]` failed, `[--]` pending, spinner cell while running — `step n/14 - Ns elapsed` footer, `Bootstrap complete.` when finished. The panel redraws in place on a TTY; prompts and noisy commands (apt, sudo, chsh) print below it and the panel reprints fresh; when piped, init prints plain `label: detail` lines instead. Tests record frames through the fake Host. API Key values never appear.

**Blocked by:** 05: `dotfiles init` installs the zsh Workflow; 06: `dotfiles init` installs herdr; 07: `dotfiles init` installs pi, Skills, and XDG MCP; 09: `dotfiles init` optional Ghostty; 11: `dotfiles init` installs Zed

**Status:** done

- [x] Every init step reports state changes through the Host as frames
- [x] Skipped steps say skipped with present/declined details
- [x] Panel renders in place with a spinner on a TTY; plain lines when piped
- [x] Prompts and noisy commands print below the panel; the panel reprints fresh
- [x] API Keys report as merged, never with values
- [x] Behaviour is observed only through the CLI against a fake Host
