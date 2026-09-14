# Preset authority: doctor packages and fail-closed validation

Status: done

## Problem Statement

`dotfiles.json` is the single source of truth for tools, skills, pi packages, OMZ plugins, packages, MCP, and API Key names. Two gaps make it less authoritative than it claims:

1. `init` installs `preset.distroPackagesFor(pm)` (`src/commands/init.ts`), but `dotfiles doctor` never checks that list. A package declared in the Preset is installed by `init` and invisible to `doctor`.
2. `parsePreset` only fails on invalid JSON syntax and a non-object root. Unknown keys and wrong types are silently ignored or coerced to defaults, and `schema/dotfiles.schema.json` is never enforced at runtime. A typo like `skillz` or `"zed": "false"` changes nothing and reports nothing.

## Solution

Grow Workflow Health and `parsePreset` in place. Doctor gains a single required `Distro packages` row that is `[ok]` only when every Preset package for the detected package manager is present, and is omitted when the Distro is unknown. `parsePreset` validates the raw Preset against the schema's shape and fails closed with a message naming every offending key. No new command, no new Host method, no new flags.

## User Stories

1. As a developer, I want `dotfiles doctor` to report whether the Preset `packages` are present so that a declared-but-missing package is visible.
2. As a developer whose Preset packages are all present, I want `[ok]  Distro packages` so that a healthy machine is obvious.
3. As a developer missing a Preset package, I want `[!!]  Distro packages` and exit 1 so that the gap fails closed like other required Workflow pieces.
4. As a developer, I want one `Distro packages` row (not one per package) so that the Workflow list does not explode.
5. As a developer whose Preset replaces the default packages, I want the row to follow the declared list so that doctor checks what `init` installs.
6. As a developer on a machine with no known package manager, I want the `Distro packages` row omitted so that doctor does not invent a check it cannot evaluate.
7. As a developer whose declared package is missing, I want it counted in `isComplete` so that `doctor --json` matches the human dashboard.
8. As a developer, I do not want the new row to change `init`'s continue? so that a missing package still runs through Bootstrap's install step.
9. As a developer, I want the package check to reuse the same package-name-as-command assumption `init` already makes so that doctor and init agree.
10. As a developer who writes an unknown key in `dotfiles.json`, I want a clear error naming that key so that a typo cannot silently do nothing.
11. As a developer who writes a wrong type (for example `"skills": "x"`), I want a clear error naming the key and expected type so that I can fix it.
12. As a developer, I want every offending key reported in one message so that I do not fix them one at a time.
13. As a developer whose Preset is valid, I want no change so that validation is invisible on a healthy file.
14. As a developer using a documented alias, I want it still accepted so that validation does not break compatibility.
15. As a developer, I want `init` and `doctor` to fail the same way before doing work so that an invalid Preset cannot half-run.
16. As a developer never wanting API Key values in validation output, I want errors to name keys only so that no secret can leak.
17. As a maintainer, I want the runtime shape to match `schema/dotfiles.schema.json` so that the editor and the CLI agree.
18. As a developer writing tests, I want every behavior observed through the CLI against a fake Host so that internals stay free to move.
19. As a maintainer, I want README Preset and doctor copy to mention validation and the package check so that user-facing docs match the CLI.

## Implementation Decisions

- Binding: ADR 0018 (Preset is the defaults file; declared lists replace defaults), ADR 0024 (validation is fail-closed). Later number wins.
- Commands stay `init`, `doctor`, `stow`, `clean`, `sync`, `edit`. No new command and no new flags.
- Host is unchanged. Package presence reuses `commandExists`, the same assumption `init` makes.
- Workflow Health adds one required check, label `Distro packages`, only when `host.packageManager()` is non-null. `ok` is true when every `preset.distroPackagesFor(pm)` name satisfies `host.commandExists`. It is not added to `isBootstrapped`.
- Validation lives in a new `src/utils/preset-validation.ts` exporting `validatePresetInput(value: unknown): string[]`, returning a problem per offending key. `parsePreset` calls it after `JSON.parse` and throws one `Invalid dotfiles.json: <problems joined by "; ">` error when any problem exists.
- Validated shape: root keys `$schema`, `tools`, `skills`, `piPackages`, `pi_packages`, `omzPlugins`, `omz_plugins`, `packages`, `distroPackages`, `distro_packages`, `apiKeys`, `mcp`; `tools` keys `ghostty`, `zed`, `skills`, `piPackages`, `pi_packages`, `omzPlugins`, `omz_plugins`, each boolean; the list keys are arrays of strings; the package keys are an array of strings or a map of `apt`/`pacman`/`dnf`/`zypper` to string arrays; `mcp` values set exactly one of a string `url` or a non-empty string `command`, with `args` allowed only alongside `command` as a string array.
- The invalid-JSON error stays `Failed to parse dotfiles.json: <reason>`. The non-object-root error stays `Invalid dotfiles.json: root must be an object`.
- Error messages name keys and expected types only, never values.

## Testing Decisions

- Assert CLI exit code, stdout/stderr, and `--json` body only. The module under test is the `dotfiles` CLI via `run(args, fakeHost)`.
- Cover: healthy Host with a known package manager reports `[ok]  Distro packages` and the expected required count; a missing declared package reports `[!!]`, exits 1, and sets `isComplete` false; a custom Preset `packages` list replaces defaults; an unknown Distro omits the row and keeps the previous required count; `init` continue? still ignores the packages check.
- Cover validation: unknown root key; unknown `tools` key; non-boolean tool; wrong-typed list; wrong-typed package map; package manager outside the four; `mcp` server with neither or both of `url`/`command`; `mcp` unknown server key; non-object root; invalid JSON. Assert the message names the key, that all problems appear in one error, and that documented aliases are still accepted.
- No unit tests of `validatePresetInput` or Workflow Health internals in isolation.

## Out of Scope

- New commands or flags; a `validate` command
- New Host methods
- Enforcing validation by loading `schema/dotfiles.schema.json` at runtime or adding a JSON Schema dependency
- Changing `init`'s install path or continue? logic; changing `stow`, `sync`, `clean`, or `edit`
- Reporting missing packages one row per package, or a new doctor side section
- Removing the documented Preset aliases
- Remote (URL) schema refetching or `$schema` resolution
