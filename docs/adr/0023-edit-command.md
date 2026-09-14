# A sixth command: `dotfiles edit`

The command surface was `init`, `doctor`, `stow`, `clean`, `sync`, and later specs repeated "no sixth command". That rule rejected Homebrew-shaped surfaces (`package`, `update`, `repair`, `link`), a `completions` command, and — in the v2 Out of Scope list — `edit`.

`dotfiles edit` opens the Preset (`dotfiles.json`) in `$EDITOR`. It is a thin convenience over the one file a developer edits most when changing the Workflow. It installs nothing, upgrades nothing, and introduces no second list.

The surface becomes `init`, `doctor`, `stow`, `clean`, `sync`, `edit`. "No sixth command" still forbids `package`, `update`, `repair`, `link`, `completions`, and any future command that upgrades tools or duplicates Bootstrap. Supersedes the "no sixth command" clauses in `docs/specs/dotfiles-cli-bootstrap.md`, `docs/specs/deepen-codebase-architecture.md`, `docs/specs/mise-tools.md`, `docs/specs/help-stow-report-mcp.md`, `docs/specs/v2-agents-flags-completions.md`, and `docs/specs/doctor-api-keys-and-mcp-health.md`.
