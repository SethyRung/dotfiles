# Candidate features for `dotfiles`

The user asked to add “more features” to this personal Linux Bootstrap CLI without naming any. This note lists what the `dotfiles` command actually does today, what ADRs and specs already forbid, and which next features can grow `src/cli.ts` + Host without inventing a parallel CLI. Inspiration (dmmulroy `dot`) and other Linux bootstrap tools are used as idea sources only; they are not user demand.

## Current CLI surface (from code)

Dispatcher (`src/cli.ts`): `args[0]` is the command. Extra argv after the command is ignored. `-h` / `--help` / no args print help and exit 0. Unknown command: exit 1, help on stderr. There is no `--version`, no per-command help, and no flags.

Help (`src/consts/help.ts`): `init`, `doctor`, `stow`, `clean`, `sync`. Tests assert help does **not** contain `update` or `repair` (`tests/cli.test.ts`).

| Command  | What it actually does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init`   | Fail fast if `packageManager()` is null. If Workflow already looks present (`assessWorkflow` → `isBootstrapped`), `Continue? [y/N]`; decline is a no-op. Else Progress Log of 14 steps: Distro packages (zsh/git/stow via Package Map, skip present), Oh My Zsh, OMZ plugins, mise Upstream Install if missing, Stow `home/` (Ghostty config skipped; conflict confirm on re-run), always `installMiseTools`, pi packages only if pi was missing, Zed Upstream if missing, missing Skills, OpenCode MCP mirror, API Key CSV prompt (empty skips; confirm then `mergeApiKeys`), Ghostty prompt default no (zypper: warn, don’t abort), login shell → zsh, `linkDotfiles`. Optional reboot prompt only if shell changed. Fail-fast on required errors. (`src/commands/init.ts`) |
| `doctor` | Render `assessWorkflow`: 16 required checks, Ghostty optional `[skip]`/`[ok]`, API Key **names** from `/etc/environment` (all keys in the file, not a declared expected list), broken Stow links. Exit 0 iff all required ok **and** no broken links. Never prints values. (`src/commands/doctor.ts`, `src/utils/workflow-health.ts`)                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `stow`   | `linkDotfiles()` then `stowTree()` (full tree, including Ghostty config). Silent on success. No MCP mirror. (`src/commands/stow.ts`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `clean`  | List Host `stowBackups()`, confirm, `removeFile` each. No backups: exit 0. (`src/commands/clean.ts`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `sync`   | `pullRepo()` (`git pull --ff-only`), then Stow (no PATH relink — `stow()` not `stowCommand()`), then MCP mirror. Never `installMiseTools` / packages / Upstream. Dirty/diverged pull fails before Stow. (`src/commands/sync.ts`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

Production Host is `unixHost` (`src/unix-host.ts`). Tests call `run()` with `createFakeHost`. Delivery is `host.stowTree()` (direct `home/` → `$HOME` symlinks), not an exec of GNU Stow, though `stow` is still a Distro package (`src/consts/package-map.ts`).

README matches `init.ts` (mise, 14 steps). This note uses the code.

**Done specs, not new commands.** `docs/specs/deepen-codebase-architecture.md` and `docs/specs/mise-tools.md` are **done** (tickets 01–04 in each `.scratch/` folder are done). Deepen Out of Scope: “Adding new CLI commands (commands remain `init`, `doctor`, `stow`, `clean`, `sync`).” Mise-tools Out of Scope: “New CLI commands (`package`, `update`, `mise`).” Leftover from deepen: `stowTree` still returns `void`, not a structured report — that is a flag on existing commands, not a sixth command. `Host.progress(frame)` is unused leftover; sessions use `update`.

## Binding constraints

| Constraint                                                                                                             | Source                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Grow `src/cli.ts` + Host only; Host is the only seam                                                                   | `AGENTS.md`; bootstrap spec Implementation Decisions                                                                                            |
| User-facing command is `dotfiles`, not `dot`, not `./install`                                                          | `docs/adr/0009-cli-named-dotfiles.md`, `docs/adr/0003-dot-cli.md`                                                                               |
| v1 commands: `init`, `doctor`, `stow`, `clean`, `sync`                                                                 | `docs/specs/dotfiles-cli-bootstrap.md` User Story 5 / Implementation Decisions; `src/consts/help.ts`                                            |
| Config sync is `sync`, never tool upgrades; do not name it `update`                                                    | `docs/adr/0015-sync-not-update.md` (supersedes 0014)                                                                                            |
| Distro via Package Map (apt/pacman/dnf/zypper); unknown Distro fails before install; not Ubuntu-only; not Nix/Homebrew | `docs/adr/0001-any-distro.md`, `docs/adr/0004-package-map-and-upstream-installs.md`                                                             |
| bun/Node/herdr/pi/OpenCode are Mise Tools; nvm superseded; mise itself is Upstream                                     | `docs/adr/0016-mise-tools.md` (supersedes 0013)                                                                                                 |
| API Keys merge into `/etc/environment`; do not replace the file; no user-owned 600 file                                | `docs/adr/0002-api-keys-in-etc-environment.md`                                                                                                  |
| Skills via skills.sh list; MCP SOT is XDG `mcp.json`; OpenCode `mcp` is a generated mirror                             | `docs/adr/0007-skills-via-skills-sh-mcp-via-xdg.md`, `docs/adr/0010-opencode-mcp-mirrors-xdg.md`                                                |
| No pi model/provider restore; no auto-generated pi extensions; no OpenCode-local skills                                | `docs/adr/0008-pi-config-minus-model.md`, `docs/adr/0012-pi-extensions-not-snapshotted.md`, `docs/adr/0011-opencode-config-not-local-skills.md` |
| Repo path `~/Documents/projects/personal/dotfiles`, not `~/.dotfiles`                                                  | `docs/adr/0006-repo-lives-under-documents.md`                                                                                                   |
| TypeScript on bun; bash stub chicken-eggs mise then bun                                                                | `docs/adr/0005-dot-is-typescript-on-bun.md` (amended by 0016)                                                                                   |
| Linux only; Workflow is CONTEXT.md’s list (no nvim/tmux/Android); git package only                                     | `CONTEXT.md`; `AGENTS.md`; bootstrap spec Out of Scope                                                                                          |
| Later ADR number wins                                                                                                  | `AGENTS.md`                                                                                                                                     |

**Classification used below:** **ADR-forbidden** = needs a superseding ADR. **v1-out-of-scope** = bootstrap (or later) spec excluded it; no ADR forbids it forever. **open** = not rejected.

## Inspiration CLI diff (dmmulroy)

Primary: [dmmulroy/.dotfiles](https://github.com/dmmulroy/.dotfiles). Named in bootstrap spec Further Notes. macOS + Homebrew + Fish + GNU Stow exec + Brewfiles. Command is `dot` (this repo rejected that name). Entrypoint is bash `dot` (this repo is TS on bun).

Commands from `dot` `cmd_help` / `main` (`https://github.com/dmmulroy/.dotfiles/blob/main/dot`):

| Their command / flag                                                     | This `dotfiles`                          | Copy?                                                                                              |
| ------------------------------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `init`                                                                   | yes                                      | already                                                                                            |
| `init --skip-ssh` / `--skip-font`                                        | no                                       | SSH/fonts are v1-out-of-scope / not Workflow                                                       |
| `update` (git pull + `brew update/upgrade` + restow + `pi update --all`) | `sync` is pull+Stow+MCP only             | **ADR-forbidden** as tool upgrades / as the name `update` (0014, 0015)                             |
| `doctor`                                                                 | yes                                      | already (different checklist)                                                                      |
| `package add/remove/update/list`                                         | no                                       | **v1-out-of-scope** + Homebrew                                                                     |
| `check-packages` / `retry-failed`                                        | no                                       | Brewfile failure log; this CLI fail-fasts required Distro steps                                    |
| `stow`                                                                   | yes                                      | already (`stowTree`, also PATH stub)                                                               |
| `link` / `unlink`                                                        | PATH stub is part of `init`/`stow`       | **v1-out-of-scope** as a separate `link` command                                                   |
| `completions` (Fish)                                                     | no                                       | **v1-out-of-scope**                                                                                |
| `edit` (`$EDITOR`)                                                       | no                                       | **open** (thin)                                                                                    |
| `gen-ssh-key`                                                            | no                                       | git SSH **v1-out-of-scope**                                                                        |
| `benchmark-shell` (Fish)                                                 | no                                       | Workflow is zsh; **open** but no demand                                                            |
| `--version`                                                              | no                                       | **open**                                                                                           |
| `help [COMMAND]` / `<cmd> --help`                                        | only top-level `-h`/`--help`             | **open**; extra argv currently ignored so `dotfiles init --help` **runs Bootstrap** (`src/cli.ts`) |
| work vs personal Brewfiles                                               | no                                       | **v1-out-of-scope**                                                                                |
| clone to `~/.dotfiles`                                                   | `~/Documents/projects/personal/dotfiles` | **ADR-forbidden** (0006)                                                                           |

Do not copy Homebrew, Fish, nvim, SSH keygen, font install, work bundles, or brew/mas-style `update`.

## Candidate features (ranked)

The user did not name a feature. “Wanted” here means: a gap in **this** CLI’s own spec/code, or a first-party feature in GNU Stow / chezmoi / yadm / dmmulroy that is not already rejected. Inspiration-only items are marked.

### 1. Per-command flags and `--help` (dispatcher)

**What.** Parse argv after the command. Support `dotfiles <cmd> --help`. Reject unknown flags instead of ignoring them. Today `run()` only reads `args[0]` (`src/cli.ts`).

**Evidence.** dmmulroy refuses extra args (`__require_no_args`) and handles `<cmd> --help` before side effects (`dot` `main`). This repo’s `dotfiles init --help` would Bootstrap. No user asked; the gap is in this dispatcher.

**Status.** **open** (bootstrap spec listed help as `dotfiles --help` or equivalent — story 50 — not per-command). Completions stay v1-out-of-scope.

**Surface.** Dispatcher in `src/cli.ts`; each command may grow flags. Not a new command.

**Host.** None unless a flag maps to an existing method.

### 2. Dry-run on `stow` / `sync` (and optionally `init` Stow)

**What.** Print what would be linked, backed up, skipped, replaced; do not write. GNU Stow: `-n` / `--no` / `--simulate` “Do not perform any operations that modify the file system; in combination with `-v` can be used to merely show what would happen” ([Invoking Stow](https://raw.githubusercontent.com/aspiers/stow/master/doc/stow.texi)). chezmoi global `--dry-run` ([flags](https://www.chezmoi.io/reference/command-line-flags/global/)).

**Evidence.** First-party Stow/chezmoi. The done deepen spec specified `stowTree` returning `{ linked, backed up, skipped }` (`docs/specs/deepen-codebase-architecture.md` Deep Stow Module); the shipped method is still `stowTree(): Promise<void>` (`src/types/host.ts`). `stow` is silent on success (`src/commands/stow.ts`). Not user-named.

**Status.** **open**. Replacing GNU Stow with chezmoi is **v1-out-of-scope**; a simulate flag on this Host Stow is not.

**Surface.** Flag on `stow` and `sync` (and maybe `init`). Not a new command.

**Host.** `stowTree` needs a dry-run option and a report. Fake Host must match.

### 3. Stow summary / verbose report

**What.** After a real Stow, print linked / timestamp-backed-up / skipped dests (GNU Stow `-v` / `--verbose`; chezmoi `-v`). Same StowReport as (2).

**Evidence.** Deepen spec (done) user stories 1–4 and Implementation “Return a structured report” — leftover, not a new spec. Current success path is empty stdout. Doctor already lists _broken_ links but not _what the last stow did_.

**Status.** **open**.

**Surface.** Default short summary or `-v` on `stow`/`sync`/`init`. Not a new command.

**Host.** Same StowReport as (2).

### 4. MCP mirror on `stow` (not only `init`/`sync`)

**What.** After linking `home/`, refresh OpenCode `mcp` from XDG `mcp.json`. Today only `init` and `sync` call `mirrorOpenCodeMcp` (`src/utils/mcp.ts`). `stow` does not. Editing the Stowed XDG file (it is a symlink into the repo) leaves OpenCode’s `mcp` key stale until `sync` (which also `git pull --ff-only`) or a full `init`.

**Evidence.** ADR 0010: XDG is the only list; OpenCode cannot read it; a second hand list was rejected because it would drift. OpenCode spec story 13: re-run of init refreshes the key. No dedicated “mirror” command exists; attaching it to `stow` keeps v1 commands.

**Status.** **open**. A new `mcp` command would be a parallel surface (avoid). `sync --no-pull` is an alternative flag, thinner than putting mirror on `stow`.

**Surface.** Behavior on existing `stow` (and keep it on `sync`/`init`).

**Host.** None new (`readFile` / `writeFile` already used).

### 5. Doctor: expected API Key names vs all of `/etc/environment`

**What.** Bootstrap spec story 45: doctor reports whether **expected** API Key names exist, without values. Implementation lists **every** `NAME=` in `/etc/environment` (`unixHost.listApiKeyNames`). `PATH` and Distro lines would show under “API Keys”. There is no committed expected-name list in `src/`.

**Evidence.** Spec vs code mismatch. README example keys (`OPENROUTER_API_KEY`, `OPENAI_API_KEY`) are examples, not a lockfile. Thin: no declared expected set.

**Status.** **open** as a `doctor` behavior fix. Inventing a second secrets file is **ADR-forbidden** (0002).

**Surface.** `doctor` only. Host `listApiKeyNames` may need a filter, or doctor compares against a const list.

### 6. Non-interactive / `--yes` for remaining prompts

**What.** chezmoi `--force` (no prompt). dmmulroy `init` skip flags. This CLI prompts: continue?, Stow overwrite on re-run, API Keys, `/etc/environment` confirm, Ghostty, reboot.

**Evidence.** First-party chezmoi. Fresh Install path is still `./dotfiles init` with TTY prompts (`README.md`). No user asked for unattended Bootstrap.

**Status.** **open**. Do not skip required Distro fail-fast. Ghostty default remains no (`CONTEXT.md` / bootstrap story 29).

**Surface.** Flags on `init` (and `clean`). Not a new command.

**Host.** `prompt` stays; commands short-circuit.

### 7. `sync` without pull / local config apply

**What.** Re-Stow + MCP without `git pull --ff-only` when the working tree is already the desired config. Overlaps (4): `stow` + MCP is enough if PATH relink is wanted too (`stow` already relinks PATH; `sync` currently does **not** call `linkDotfiles`).

**Evidence.** Code split, not user demand. ADR 0015 defines `sync` as pull then Stow then MCP — changing that meaning needs care; adding a flag is **open**.

**Surface.** Prefer (4) over a `sync --no-pull` that redefines Sync.

### 8. Completions (zsh)

**What.** chezmoi `completion zsh`; yadm `introspect` “to support command line completion”; dmmulroy `completions` (Fish).

**Evidence.** Inspiration + comparable tools. Bootstrap spec Out of Scope: “`package add/remove`, completions, `link` as a separate command.”

**Status.** **v1-out-of-scope**. Not ADR-forbidden.

**Surface.** New command or generated file under `home/`. Host: maybe `writeFile`.

### 9. `--version`

**What.** dmmulroy `--version`; GNU Stow `-V`; yadm `version`; chezmoi `--version`.

**Evidence.** Inspiration only. This repo has no version field in `package.json` beyond private package name.

**Status.** **open**. Thin.

**Surface.** Dispatcher flag. No Host.

### 10. `edit` (open repo in `$EDITOR`)

**What.** dmmulroy `dot edit`.

**Evidence.** Inspiration only. Workflow IDE is Zed (`CONTEXT.md`); `$EDITOR` is not part of Bootstrap.

**Status.** **open**. Thin. Host would need an `openEditor` (new seam method — only if the command is worth it).

### 11. `unlink` PATH stub / separate `link`

**What.** dmmulroy `link`/`unlink`. This CLI always (re)writes `~/.local/bin/dotfiles` from `init`/`stow`.

**Status.** **v1-out-of-scope** as a separate `link` command. Unlink similarly fragments PATH ownership.

### 12. `check-packages` / `retry-failed` analog

**What.** Report missing Distro/Mise/Upstream pieces and retry. `doctor` already reports presence; `init` already skip-if-present / fail-fast. dmmulroy continues past brew failures and logs `packages/failed_packages_*.txt`.

**Status.** Retry-failed is a Homebrew resilience pattern this CLI rejected for **required** steps (fail fast, bootstrap story 48). Optional Ghostty already warns. **open** only as “init continues missing optional pieces” (already true). Do not add a brew-style failed-packages log.

### 13. `doctor --json` / machine-readable health

**What.** chezmoi `dump --format=json`. `assessWorkflow` already returns a struct.

**Status.** **open**. Thin demand. Flag on `doctor`. Host: none.

### 14. Install-only-missing without full `init` (a `repair` command)

**What.** Doctor lists gaps; a second command installs only those. Tests forbid `repair` in help (`tests/cli.test.ts`). Designed path is re-run `init` (continue? + skip present).

**Status.** **v1-out-of-scope** as a new command. Flag `init --yes` (6) is the smaller form.

## Host seam gaps

| Host method                                                                                                                                     | Used by                                                    | User command?                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| `startProgress`                                                                                                                                 | `init`                                                     | Progress Log only                                     |
| `progress(frame)`                                                                                                                               | **no command** (`src/types/host.ts` / `unix-host.ts` only) | leftover; sessions use `update`                       |
| `homeTree()`                                                                                                                                    | unixHost internally (`stowBackups`, `stowTree`)            | none                                                  |
| `readFile` / `writeFile`                                                                                                                        | MCP mirror                                                 | not a command                                         |
| `installMiseTools`, `runUpstreamInstall`, `installPackages`, `installPiPackages`, `installSkills`, `changeLoginShell`, `reboot`, `mergeApiKeys` | `init` only                                                | no dedicated command (by design: Bootstrap is `init`) |
| `pullRepo`                                                                                                                                      | `sync`                                                     | `sync`                                                |
| `stowTree` / `linkDotfiles`                                                                                                                     | `stow`, `init`, `sync` (stow only, no PATH)                | `stow` does not return a report                       |
| `listApiKeyNames` / `brokenStowLinks`                                                                                                           | `doctor`                                                   | report only                                           |
| `stowBackups` / `removeFile`                                                                                                                    | `clean`                                                    | `clean`                                               |

User-visible jobs with no dedicated command (README / doctor / Workflow Health): add API Keys after an empty skip (re-run `init` already re-prompts); refresh OpenCode MCP without `git pull`; see what Stow would do; per-command help. Ghostty-later is already `init` re-offer if missing.

## Non-starters (explicitly rejected)

| Idea                                                                 | Why                                                                   | Citation                                                  |
| -------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| Name the CLI `dot`                                                   | PATH collision                                                        | ADR 0009; bootstrap Out of Scope                          |
| `./install` instead of CLI                                           | Want dmmulroy-style commands                                          | ADR 0003                                                  |
| `dotfiles update` as a command                                       | Sounds like tool upgrades                                             | ADR 0015                                                  |
| Tool upgrades via this CLI (`brew`/`mas`/`mise upgrade`/`pi update`) | No version state; upgrades stay with each tool; `sync` never installs | ADR 0014, 0015; mise-tools story 45 / Out of Scope        |
| `package add/remove`                                                 | v1 excluded; Homebrew-shaped                                          | bootstrap Out of Scope; mise-tools Out of Scope           |
| Homebrew / Nix as package strategy; Ubuntu-only                      | Package Map + four families                                           | ADR 0001, 0004; bootstrap Out of Scope                    |
| macOS / Windows                                                      | Linux only                                                            | README Scope; bootstrap Out of Scope                      |
| chezmoi or copy-instead-of-Stow as replacement                       | Stow delivery                                                         | bootstrap Out of Scope                                    |
| Completions, separate `link`                                         | v1 excluded                                                           | bootstrap Implementation Decisions / Out of Scope         |
| Pin Upstream / Mise Tool versions; `mise.lock`                       | always latest / Node `lts`                                            | bootstrap Out of Scope; ADR 0016; mise-tools Out of Scope |
| Snapshot Skill files; OpenCode-local skills                          | skills.sh + ADR 0011                                                  | ADR 0007, 0011                                            |
| `~/.pi/agent/mcp.json` as MCP SOT; hand-maintained OpenCode MCP      | XDG + mirror                                                          | ADR 0007, 0010                                            |
| Restore pi/OpenCode default model; snapshot pi `extensions/`         | ADR 0008, 0012                                                        |                                                           |
| Replace `/etc/environment` wholesale; user-owned 600 secrets file    | ADR 0002                                                              |                                                           |
| git config / identity / GitHub SSH                                   | bootstrap Out of Scope                                                |                                                           |
| nvim, tmux, docker, Android SDK, Yoga 9 rest                         | CONTEXT.md Workflow; AGENTS.md                                        |                                                           |
| Work vs personal bundles                                             | bootstrap Out of Scope                                                |                                                           |
| Distro-package mise; mise for Ghostty/Zed/OMZ                        | ADR 0016; mise-tools Out of Scope                                     |                                                           |
| New commands `package` / `update` / `mise` / deepen-era extras       | mise-tools + deepen Out of Scope                                      |                                                           |
| Repo at `~/.dotfiles`                                                | ADR 0006                                                              |                                                           |
| Delete leftover `~/.bun` / `~/.nvm`                                  | mise-tools Out of Scope                                               |                                                           |

## Recommended next 2–4

These fit “extend `src/cli.ts` + Host”, do not need a superseding ADR, and have the strongest **in-repo or first-party** case. They are not user-named features.

1. **Dispatcher: per-command `--help` and reject unknown extra args** (`src/cli.ts`). Strongest bug-shaped gap: `dotfiles init --help` currently Bootstraps. Matches dmmulroy’s “help before side effects” without copying Homebrew/SSH. No Host change. Unlocks flags for (2)–(3).

2. **`stow --dry-run` / `sync --dry-run` via a Host StowReport.** GNU Stow `--simulate` + chezmoi `--dry-run` + the leftover `stowTree` report from the done deepen spec. A flag on existing commands, not a new command.

3. **Print that StowReport on real `stow`/`sync`** (short summary or `-v`). Today success is silent; doctor can list broken links but not last-run actions. Same Host change as (2).

4. **Refresh OpenCode MCP whenever `stow` runs**, so XDG edits do not require `sync`’s `git pull` or a full `init`. Directly serves ADR 0010’s anti-drift rule using existing `readFile`/`writeFile`.

Do **not** start with completions, `package`, `update`, `link`, `edit`, or SSH — those are rejected or v1-out-of-scope, or inspiration-only with no in-repo gap.

Land (2)–(3) as Host `StowReport` plus flags, not as a sixth command. Keep `init` as the only installer.

## Sources

- `/home/sethyrung/Projects/personal/dotfiles/src/cli.ts`
- `/home/sethyrung/Projects/personal/dotfiles/src/consts/help.ts`
- `/home/sethyrung/Projects/personal/dotfiles/src/types/host.ts`
- `/home/sethyrung/Projects/personal/dotfiles/src/unix-host.ts`
- `/home/sethyrung/Projects/personal/dotfiles/src/commands/init.ts`
- `/home/sethyrung/Projects/personal/dotfiles/src/commands/doctor.ts`
- `/home/sethyrung/Projects/personal/dotfiles/src/commands/stow.ts`
- `/home/sethyrung/Projects/personal/dotfiles/src/commands/clean.ts`
- `/home/sethyrung/Projects/personal/dotfiles/src/commands/sync.ts`
- `/home/sethyrung/Projects/personal/dotfiles/src/utils/workflow-health.ts`
- `/home/sethyrung/Projects/personal/dotfiles/src/utils/mcp.ts`
- `/home/sethyrung/Projects/personal/dotfiles/src/consts/package-map.ts`
- `/home/sethyrung/Projects/personal/dotfiles/src/consts/upstream-installs.ts`
- `/home/sethyrung/Projects/personal/dotfiles/CONTEXT.md`
- `/home/sethyrung/Projects/personal/dotfiles/README.md`
- `/home/sethyrung/Projects/personal/dotfiles/AGENTS.md`
- `/home/sethyrung/Projects/personal/dotfiles/tests/cli.test.ts`
- `/home/sethyrung/Projects/personal/dotfiles/docs/adr/0001-any-distro.md` through `0016-mise-tools.md`
- `/home/sethyrung/Projects/personal/dotfiles/docs/specs/dotfiles-cli-bootstrap.md`
- `/home/sethyrung/Projects/personal/dotfiles/docs/specs/deepen-codebase-architecture.md`
- `/home/sethyrung/Projects/personal/dotfiles/docs/specs/mise-tools.md`
- `/home/sethyrung/Projects/personal/dotfiles/docs/specs/opencode-in-workflow.md`
- `/home/sethyrung/Projects/personal/dotfiles/.scratch/deepen-codebase-architecture/issues/`
- `/home/sethyrung/Projects/personal/dotfiles/.scratch/mise-tools/issues/`
- https://github.com/dmmulroy/.dotfiles
- https://github.com/dmmulroy/.dotfiles/blob/main/dot
- https://github.com/dmmulroy/.dotfiles/blob/main/README.md
- https://www.gnu.org/software/stow/
- https://raw.githubusercontent.com/aspiers/stow/master/doc/stow.texi (Invoking Stow: `--simulate`, `--verbose`, `chkstow --badlinks`)
- https://www.chezmoi.io/reference/commands/
- https://www.chezmoi.io/reference/commands/apply/
- https://www.chezmoi.io/reference/commands/completion/
- https://www.chezmoi.io/reference/commands/doctor/
- https://www.chezmoi.io/reference/commands/status/
- https://www.chezmoi.io/reference/commands/diff/
- https://www.chezmoi.io/reference/command-line-flags/global/
- https://yadm.io/docs/overview
- https://yadm.io/docs/bootstrap
- https://yadm.io/docs/common_commands
- https://github.com/yadm-dev/yadm/blob/master/yadm.md
