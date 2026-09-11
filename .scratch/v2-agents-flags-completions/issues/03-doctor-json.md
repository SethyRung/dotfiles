# 03: `doctor --json`

**What to build:** `dotfiles doctor --json` prints Workflow Health as JSON (required checks, optional Ghostty, API Key names, broken Stow links, completeness) and uses the same exit code as human doctor (zero iff required checks pass and there are no broken Stow links). Default `doctor` stays the human dashboard. JSON never contains API Key values. `--json` is doctor-only; on other commands it fails closed. Help documents `--json`; `--help` wins.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `dotfiles doctor --json` prints JSON of required checks, optional Ghostty, API Key names, broken Stow links, and completeness
- [x] Exit code matches human doctor: 0 iff required checks pass and there are no broken Stow links
- [x] `dotfiles doctor` with no flags still prints the human dashboard
- [x] JSON never contains API Key values
- [x] `doctor --json --help` prints doctor help, exits 0, and does no work
- [x] `--json` on init, stow, clean, or sync exits 1 and does no work
- [x] Doctor help documents `--json`
- [x] Behaviour is observed only through the CLI against a fake Host
