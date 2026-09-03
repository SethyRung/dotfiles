# Deepen Codebase Architecture & Bun 1.4 Runtime Leverage

Status: ready-for-agent

## Problem Statement

The `dotfiles` CLI has architectural friction where shallow modules force command orchestration to leak across the Host seam. Stow delivery leaks file collision checking, timestamped backup creation, and link replacement into command logic while `unixHost` and `createFakeHost` exhibit divergent behavior on non-symlink destinations. The Progress Log leaks step array indexing, terminal wipe calculations, and interval timers into adapter globals, while `doctor` duplicates cell formatting. `/etc/environment` parsing is duplicated across command utilities and the Host adapter, while `dayjs` remains the project's sole runtime npm dependency purely to format a single timestamp. Workflow presence detection in `init` duplicates the 16-point health check in `doctor`, risking drift when tools change.

## Solution

Deepen the modules behind the Host seam while retaining Host as the sole seam in the codebase:

1. Deepen Stow delivery into a unified execution method on Host that encapsulates collision handling, backup stamping, and symlink creation identically in both `unixHost` and `fakeHost`.
2. Deepen the Progress Log into an encapsulated progress session module that owns the spinner timer, ANSI cursor resets, and column layout with `Bun.stringWidth`, and share status cell formatting across `init` and `doctor`.
3. Deepen `/etc/environment` management behind Host methods that merge keys and list key names, eliminating raw text file manipulation across the seam, and replace `dayjs` with native ECMAScript date formatting and `bun:test` clock control for zero runtime dependencies.
4. Deepen Workflow health verification into a single module that evaluates tool, plugin, skill, and config presence once for both `init` (re-run detection) and `doctor` (diagnostic reporting).

## User Stories

1. As a developer running `dotfiles stow`, I want existing non-symlink files to be automatically backed up with a timestamp and replaced with repo symlinks so that my configuration is applied without data loss.
2. As a developer running `dotfiles stow`, I want destinations that already link into the repository to be skipped without creating unnecessary backup files so that re-Stowing is idempotent and quiet.
3. As a developer running `dotfiles stow`, I want broken or stale symlinks at the destination to be replaced directly without creating backup files so that old symlinks are cleanly updated.
4. As a developer running `dotfiles stow`, I want junk files such as logs, sockets, local caches, and secrets to be excluded from delivery so that ephemeral runtime files never get linked into my home directory.
5. As a developer running `dotfiles stow`, I want the CLI to relink the `~/.local/bin/dotfiles` executable so that the command remains callable even after repository directory moves.
6. As a developer running `dotfiles init` on a machine that already has a partial or complete Workflow, I want the CLI to detect Workflow Health and prompt before overwriting files so that existing local modifications are protected.
7. As a developer declining the overwrite prompt during `dotfiles init`, I want conflicting files left untouched while non-conflicting files are Stowed so that partial bootstrap can proceed safely.
8. As a developer watching `dotfiles init`, I want the Progress Log dashboard to render with stable column alignments even when package or tool names differ in length so that the output remains legible and professional.
9. As a developer running `dotfiles init` in an interactive terminal, I want the Progress Log to clear previous lines and redraw in place without flicker or leftover cursor artifacts so that terminal history is clean.
10. As a developer piping `dotfiles init` to a log file or non-interactive terminal, I want the Progress Log to stream terminal status lines sequentially without ANSI cursor resets so that logs are clear and readable.
11. As a developer running `dotfiles init`, I want the active step to display an animated spinner that cleanly stops as soon as all steps finish or a step fails so that no background timers leak.
12. As a developer running `dotfiles doctor`, I want the diagnostic report to format status cells using the exact same visual convention as the Progress Log so that output styling is consistent across commands.
13. As a developer running `dotfiles doctor`, I want an evaluation of all required Workflow pieces (tools, plugins, skills, MCP, shell, path symlink) and broken Stow links so that I know immediately what needs fixing.
14. As a developer running `dotfiles doctor`, I want the exit code to be zero when all required Workflow items pass and broken Stow links are absent, and non-zero when any required item or Stow link fails so that CI and scripts can rely on doctor.
15. As a developer running `dotfiles doctor`, I want missing optional tools like Ghostty reported as warnings rather than failures so that optional tools do not fail the overall check.
16. As a developer running `dotfiles doctor`, I want API Key names displayed with status cells while ensuring values are never shown or logged so that secrets remain confidential.
17. As a developer running `dotfiles init`, I want to provide API Keys as CSV pairs that merge into `/etc/environment` without modifying unrelated lines so that system-wide configuration is preserved.
18. As a developer running `dotfiles init`, I want the prompt for API Keys to allow skipping with an empty input so that Bootstrap does not block when secrets are not yet available.
19. As a developer running `dotfiles clean`, I want the CLI to locate all Stow backup files matching the timestamp pattern and report them so that I can review what was backed up.
20. As a developer confirming deletion in `dotfiles clean`, I want all Stow backup files removed from disk so that my home directory is freed from clutter.
21. As a developer declining deletion in `dotfiles clean`, I want all Stow backup files preserved so that accidental cleanup is prevented.
22. As a developer running `dotfiles sync`, I want the repository to fast-forward from origin, re-Stow configuration, and refresh the OpenCode MCP mirror without upgrading tool binaries so that config synchronization is safe and deterministic.
23. As a developer maintaining this codebase, I want `package.json` to have zero runtime dependencies so that supply-chain exposure is minimized and installation is instantaneous.
24. As an implementer, I want `createFakeHost` and `unixHost` to execute identical Stow collision and backup rules so that test runs on fake Host faithfully replicate production behavior.
25. As an implementer, I want the Host interface to expose deep domain methods rather than granular filesystem checks so that command orchestration stays concise and maintainable.
26. As an implementer, I want all command tests to execute against the single Host seam via `run(args, fakeHost)` so that internal implementation details remain free to refactor.

## Implementation Decisions

- **Single Host Seam**: Preserve `Host` as the sole seam in the codebase per `AGENTS.md`. Tests execute `run(args, host)` against `createFakeHost`. Never create parallel interfaces, secondary seams, or internal unit mocks.
- **Deep Stow Module**:
  - Collapse the five shallow Host methods (`backup`, `linksIntoRepo`, `isSymlink`, `brokenStowLinks`, `stow`) into a cohesive Stow interface on Host:
    - `stowTree(options: StowOptions): Promise<StowReport>`
    - `stowBackups(): string[]`
    - `brokenStowLinks(): string[]`
  - In `unixHost`:
    - Use `Bun.Glob` to scan the `home/` directory for relative file paths.
    - Filter paths using the existing junk and Ghostty filters.
    - Inspect destination in `$HOME`: if it is a directory or missing, create parent directories; if it is a regular file or foreign symlink, rename to `.YYYY-MM-DD_HH:mm:ss` stamp; if it already symlinks to the repository, leave it; if it is a stale symlink, remove it.
    - Atomically create symlink pointing to the repository file.
    - Return a structured report of linked, backed up, and skipped files.
  - In `createFakeHost`:
    - Replicate the exact same backup, overwrite, and link behavior against the in-memory virtual filesystem.
    - Record linked paths and backup paths for test assertions.
  - In `stowCommand` and `sync`:
    - Delegate directly to `host.stowTree(options)`.
- **Deep Progress Log Module**:
  - Encapsulate the Progress Log session lifecycle on the Host interface:
    - `startProgress(title: string, steps: ProgressStepDef[]): ProgressSession`
  - The `ProgressSession` object provides:
    - `update(stepId: string, state: ProgressState, detail?: string): void`
    - `done(): void`
  - `unixHost` implementation of `ProgressSession` encapsulates all mutable state (start timestamp, line counter, clear flag, spinner interval timer, and step index lookup).
  - In non-interactive environments (`!process.stdout.isTTY`), terminal line clearing and the spinner are disabled, streaming step completions linearly.
  - Text cell formatting (`[ok]  `, `[skip]`, `[!!]  `, spinner) is extracted into a shared formatting utility that uses `Bun.stringWidth` for terminal column alignment, ensuring multi-byte or wide characters do not misalign the table.
  - `doctor` imports and uses the shared cell formatter so `[ok]  ` and `[!!]  ` look identical across both commands.
- **Zero Runtime Dependencies & Native Bun 1.4 Leverage**:
  - Remove `dayjs` from `package.json` dependencies.
  - Implement backup timestamp formatting and validation using native ECMAScript `Date`:
    - `backupStamp(d = new Date()): string` produces `YYYY-MM-DD_HH:mm:ss` via `toISOString().slice(0, 19).replace("T", "_")`.
    - `isBackupStamp(value: string): boolean` validates the timestamp pattern with regex `^\d{4}-\d{2}-\d{2}_\d{2}:\d{2}:\d{2}$`.
  - In tests, replace custom Dayjs clock objects with `bun:test` built-in `setSystemTime(date)` and reset in teardown.
- **Deep Environment Module**:
  - Encapsulate `/etc/environment` management behind deep Host methods:
    - `mergeApiKeys(keys: Record<string, string>): Promise<void>`
    - `listApiKeyNames(): Promise<string[]>`
  - `unixHost` implementation reads `/etc/environment`, updates or appends lines while preserving comments and unrelated entries, and writes back via `sudo tee /etc/environment`.
  - `createFakeHost` simulates the file contents in memory.
  - Command modules (`init`, `doctor`) do not receive or manipulate raw `/etc/environment` file contents across the seam.
- **Unified Workflow Health Module**:
  - Create a unified `assessWorkflow(host: Host): Promise<WorkflowHealth>` module.
  - The module evaluates all 16 Workflow checklist items:
    - Required tools: zsh, git, stow, mise, npm, bun, pi, herdr, opencode, zed.
    - Required directories & files: `.oh-my-zsh`, OMZ plugins, Skills, XDG MCP config, login shell (`isZsh`), and `~/.local/bin/dotfiles` symlink.
    - Optional tools: Ghostty.
    - API Key names and broken Stow links.
  - Returns `{ isComplete: boolean, checks: WorkflowCheck[], keys: string[], brokenLinks: string[] }`.
  - `init` checks `health.isComplete` to determine if Workflow is already present before prompting to continue.
  - `doctor` renders the checklist directly from `health.checks`, eliminating redundant checks.

## Testing Decisions

- **Test Through the Seam Only**: Tests must only invoke `run(args, fakeHost)` and inspect returned `RunResult` (exitCode, stdout, stderr) and observable `fakeHost` state. Never unit test internal functions or adapters directly.
- **No Production I/O in Tests**: Tests must never access real filesystem paths, spawn external commands, invoke `apt`/`sudo`, or touch real `/etc/environment`.
- **Existing Test Suite Baseline**: All 93 existing tests in `tests/commands/` and `tests/cli.test.ts` must continue to pass, verifying full backward compatibility of the CLI behavior.
- **Clock Control in Tests**: Use `bun:test` `setSystemTime` in tests that assert timestamped backup file creation, ensuring deterministic test runs.

## Out of Scope

- Adding new CLI commands (commands remain `init`, `doctor`, `stow`, `clean`, `sync`).
- Modifying Distro Package Map or Upstream Installs logic.
- Snapshotting OpenCode-local skills, Zed extensions, or pi default model configuration.
- Upgrading tools during `sync` (ADR 0015).
- Multi-user or non-Linux system support (ADR 0001, ADR 0002).

## Further Notes

- The deepening reduces the Host interface from 27 methods down to focused domain operations, improving AI navigability and eliminating interface shallowness.
- Dropping `dayjs` leaves `package.json` with zero production dependencies, leaning fully on Bun 1.4 standard library capabilities.
