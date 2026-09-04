# 02: Unified Workflow Health assessment

**What to build:** The health of the development Workflow is assessed once through a unified evaluation module, eliminating duplicate checks between `dotfiles doctor` and `dotfiles init`. `dotfiles doctor` renders its diagnostic checklist directly from the assessment report, and `dotfiles init` checks whether the Workflow is already complete before prompting to continue on re-runs.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] All 16 required Workflow items (Distro packages, Oh My Zsh, plugins, mise, npm, bun, pi, herdr, OpenCode, Zed, Skills, XDG MCP, login shell, dotfiles symlink) and optional items (Ghostty) are evaluated through a single health assessment function.
- [x] `dotfiles doctor` formats its report from the assessment results, reporting required items with status cells, optional tools as warnings, and broken Stow links.
- [x] `dotfiles doctor` exits zero when all required items and Stow links are healthy, and exits non-zero if any required item or Stow link fails.
- [x] `dotfiles init` uses the assessment's completion status to detect whether the Workflow already looks present, prompting the user before continuing.
- [x] Neither command duplicates tool checking logic, ensuring detection rules stay in sync as Workflow requirements evolve.
- [x] Existing command test suites for `doctor` and `init` remain green with identical behavior.
