# edit command opens the Preset

Status: done

## Problem Statement

`dotfiles` has no way to open `dotfiles.json` from the CLI. The developer must know the repo path and the editor invocation. v2 listed `edit` as Out of Scope, so the Preset — the file edited most when changing the Workflow — has no command.

## Solution

Add a sixth command, `dotfiles edit`, backed by one new Host method `openEditor`. The command opens `<repoDir>/dotfiles.json` in `$EDITOR`. No flags beyond `-h` / `--help`. ADR 0023 reopens the command surface for this one thin command.

## User Stories

1. As a developer, I want `dotfiles edit` to open `dotfiles.json` in `$EDITOR` so that I can change the Preset without remembering the repo path.
2. As a developer whose editor exits cleanly, I want exit zero and a short confirmation so that a successful edit is obvious.
3. As a developer whose `$EDITOR` is unset or empty, I want a non-zero exit and a clear message so that I know what to set.
4. As a developer whose `$EDITOR` carries arguments (such as `nvim -f`), I want those arguments honored so that my normal editor invocation works.
5. As a developer whose editor exits non-zero, I want a non-zero exit and the code so that a failed edit is visible.
6. As a developer, I want `dotfiles edit --help` and `dotfiles edit -h` to print edit help and exit zero so that help never launches an editor.
7. As a developer who passes `--help` with other argv, I want help to win and no editor to launch.
8. As a developer who passes an unknown flag or an extra positional to `edit`, I want a non-zero exit and no editor so that typos cannot spawn work.
9. As a developer reading top-level help, I want `edit` listed so that the command is discoverable.
10. As a developer, I want `edit` to install nothing, upgrade nothing, and write nothing to the machine so that it stays a thin convenience.
11. As a developer in zsh, I want `dotfiles edit<TAB>` completed so that the command is reachable from the existing completion.
12. As a maintainer, I want README command copy for `edit` so that the user-facing doc matches the CLI.
13. As a developer writing tests, I want every behavior observed through the CLI against a fake Host so that internals stay free to move.

## Implementation Decisions

- Binding: ADR 0023 reopens the command surface for `edit` only. ADR 0018 keeps `dotfiles.json` the Preset. Later ADR wins.
- Commands become `init`, `doctor`, `stow`, `clean`, `sync`, `edit`. No other new command.
- Host gains `openEditor(target: string): Promise<void>`. It is the only seam; no second editor mechanism.
- Production `openEditor` reads `$EDITOR`, splits it on whitespace, spawns the first token with the remaining tokens plus the target, inherits stdio, and throws when `$EDITOR` is unset/empty or the editor exits non-zero.
- `$VISUAL` is not consulted. There is no fallback editor.
- The command targets `<repoDir>/dotfiles.json` only. It takes no path argument and no flags except `-h` / `--help`.
- The command catches Host errors and returns exit 1 with the message on stderr; success prints `Opened <path> in $EDITOR.` on stdout and exits zero.
- `edit` does not check that the Preset exists; the editor may create it.
- `edit` never writes to the machine beyond the editor's own edits.
- Top-level help, per-command help, and the Stowed zsh completion list `edit`.

## Testing Decisions

- Assert CLI exit code, stdout/stderr, and fake Host effects only. No unit tests of the `unixHost` adapter or the editor spawn.
- The module under test is the `dotfiles` CLI via `run(args, fakeHost)`. The fake Host records editor opens and can be told to throw.
- Cover: `edit` opens `<repoDir>/dotfiles.json`; success prints the path and exits zero; editor error exits 1 and prints the message; `edit --help` / `-h` prints help and never opens the editor; `--help` with other argv wins; unknown flag and extra positional exit 1 with no editor; top-level help lists `edit`; the zsh completion completes `edit`; `edit` triggers no installs, Stows, prompts, or repo pulls.

## Out of Scope

- Editing an arbitrary path or the repo root; `edit` always targets `dotfiles.json`
- `$VISUAL`, an editor fallback, or opening an IDE / Zed
- New `edit` flags (for example `--path`, `--repo`)
- Any command other than `edit`; `package`, `update`, `repair`, `link`, and `completions` stay rejected
- Changing `init`, `doctor`, `stow`, `clean`, or `sync`
