# Doctor expected API Keys and MCP vs Preset

Status: done

## Problem Statement

`dotfiles doctor` cannot tell whether expected API Key names exist. It lists every `NAME=` in the default env stores as `[ok]`, so `PATH` and Distro lines look like secrets, and a missing expected name never shows `[!!]`. Workflow Health MCP means “pi’s mcp.json exists”, not “the Preset `mcp` list is translated into pi, OpenCode, Grok, and Codex”. After v2, those doctor bugs were left for later. The developer wants doctor (human and `--json`) to report API Key **names** and real MCP health without leaking values, without a sixth command, and without new Host methods.

## Solution

Grow `dotfiles doctor` in place. Expected API Key names live in the Preset as a name-only list. Doctor reports each expected name present or missing against the Host’s existing env-store listing, never values, never extra store keys. MCP is `[ok]` only when all four agent dests exist and match the Preset translations. Same CLI seam: `run()` against a fake Host. Init, stow, sync, and the Host interface stay as they are except that shared Workflow Health used by doctor (and init’s continue?) sees the new MCP check.

## User Stories

1. As a developer, I want `dotfiles doctor` to report each expected API Key **name** as present or missing so that I can see secret coverage without opening the env store.
2. As a developer, I want missing expected names shown as `[!!]` so that a gap is visible the same way other Workflow failures are.
3. As a developer, I want present expected names shown as `[ok]` so that a healthy store is obvious.
4. As a developer, I never want API Key **values** in doctor stdout, stderr, or `--json` so that secrets cannot leak from Workflow Health.
5. As a developer whose env store contains `PATH` (or other Distro lines), I do not want those names listed under API Keys so that doctor does not pretend they are secrets.
6. As a developer whose env store contains extra `NAME=` lines that are not in the expected list, I do not want doctor to dump them so that the API Keys section is only the Preset list.
7. As a developer, I want expected names to come from the Preset `apiKeys` list so that doctor has a declared set like skills and MCP, not “whatever is in the store”.
8. As a developer who omits `apiKeys` in a local Preset, I want the committed defaults used so that a partial Preset still has an expected set.
9. As a developer who sets `apiKeys` to an empty list, I want the API Keys section omitted so that a Workflow with no expected secrets stays quiet.
10. As a developer who declares a custom `apiKeys` list, I want that list to replace defaults completely so that Preset replacement matches skills, pi packages, OMZ plugins, packages, and MCP.
11. As a developer running `dotfiles doctor --json`, I want each expected key as `{ name, ok }` so that scripts can see missing names without parsing the human panel.
12. As a developer running `dotfiles doctor --json` when no names are expected, I want `keys` to be `[]` so that JSON stays stable.
13. As a developer with all required Workflow pieces and all expected keys present, I want doctor to exit 0 so that a healthy machine is a green check.
14. As a developer with a missing expected API Key, I want doctor to exit 1 so that CI and `doctor --json` fail closed on secret gaps.
15. As a developer with a missing expected API Key, I still want the Workflow “required ok” count to reflect only the existing required checks (not one row per key) so that the footer does not explode into N extra required pieces.
16. As a developer, I want `isComplete` false when any expected API Key is missing so that `--json` matches “this machine is not fully healthy”.
17. As a developer, I do not want missing API Keys to change init’s continue? (`isBootstrapped`) so that a machine without secrets can still be treated as already Bootstrapped.
18. As a developer, I want doctor to keep scanning the Host’s existing env-store listing (the default locations the Host already reads) so that no new Host method is required.
19. As a developer who wrote keys to a custom store path, I do not need doctor to discover that path in this spec so that custom-store discovery stays later.
20. As a developer, I do not want API Key names or values committed as secrets so that the public repo stays public; names in the Preset are identifiers, never values.
21. As a developer, I do not want `.env` to be doctor’s lockfile so that a gitignored input file cannot be the only source of expected names.
22. As a developer, I want the MCP Workflow row to mean “Preset `mcp` is translated into pi, OpenCode, Grok, and Codex” so that a dest file that exists but is empty or stale is not `[ok]`.
23. As a developer whose four agent dests exist and match the Preset translations, I want MCP `[ok]` so that a post-Stow/Sync machine looks healthy.
24. As a developer missing any of the four agent dests, I want MCP `[!!]` so that a partial tree is not reported as MCP-complete.
25. As a developer whose dest exists but servers do not match the Preset (stale, extra, or missing servers), I want MCP `[!!]` so that drift is visible without a sixth command.
26. As a developer, I want that MCP mismatch to fail required Workflow (exit 1, `isComplete` false) so that MCP stays a required check, not optional like Ghostty.
27. As a developer, I want a single MCP row (not four) so that doctor’s Workflow list does not grow a row per agent.
28. As a developer, I do not want doctor to invent or write agent configs so that doctor stays read-only.
29. As a developer, I do not want init’s continue? to start requiring MCP dests (`isBootstrapped` still omits MCP and the PATH symlink) so that this spec does not change Bootstrap skip logic beyond the shared MCP **required** check that doctor already used for the pi file.
30. As a developer running init, I still want `mirrorMcp` after Stow so that translations stay a write path; doctor only reads.
31. As a developer, I do not want a new `keys` or `mcp` command so that the surface stays init, doctor, stow, clean, sync.
32. As a developer, I do not want new Host methods so that `listApiKeyNames`, `readFile`, and `fileExists` stay the listing/read path.
33. As a developer, I want invalid Preset JSON to keep failing doctor before a report so that fail-closed parse is unchanged.
34. As a developer with `tools.zed` or `tools.skills` false, I want those Workflow rows still omitted and API Keys / MCP behavior unchanged so that tool toggles do not interact with this cut.
35. As a developer running `dotfiles doctor --help`, I want existing doctor help (including `--json`) and no new flags so that this spec does not grow argv.
36. As a developer, I want README doctor copy to mention expected names and MCP-vs-Preset so that user-facing docs match the CLI.
37. As an implementer, I want every behavior above observable through `run(["doctor"])` and `run(["doctor", "--json"])` against a fake Host so that internals stay free to move.

## Implementation Decisions

- Binding: ADR 0002 (merge, never print values), ADR 0017 (`.env` is Bootstrap input; store is selectable; doctor does not gain custom-path discovery here), ADR 0018 / 0022 (Preset is the defaults file; declared lists replace defaults), ADR 0019 / 0022 (MCP list is the Preset `mcp` key; agents get translated copies), ADR 0015 (sync unchanged). Later ADR wins.
- Commands stay `init`, `doctor`, `stow`, `clean`, `sync`. Doctor human and `--json` only. No new flags.
- Host is unchanged. No new methods. Expected-name filtering and MCP translator comparison happen in Workflow Health, not in the Host.
- Preset grows `apiKeys`: an array of environment variable **names**. Omitted uses committed defaults. Empty array means no expected names. Declared array replaces defaults. Schema allows that array of strings. Values never belong in the Preset.
- Workflow Health `keys` becomes a list of `{ name, ok }` for expected names only, in Preset order. Human API Keys section renders that list with `[ok]` / `[!!]` and is omitted when the list is empty.
- Extra names from `listApiKeyNames()` that are not in `apiKeys` (including `PATH`) are ignored.
- Missing expected keys: doctor exits 1; `isComplete` is false; they are **not** extra `requiredChecks` rows. Same exit idea as broken Stow links (side section, still fail closed), plus `isComplete` counts them.
- `isBootstrapped` is unchanged: still ignores MCP dests, PATH symlink, Ghostty, and API Keys.
- MCP `requiredChecks` row stays labeled `MCP`. `ok` is true only when all four agent dests exist and their stored server maps equal the Preset translations (the same translators init/stow/sync already use). One row. Doctor does not write.
- Init still calls the MCP mirror after Stow. This spec does not add `--dry-run` to init or change Stow/Sync MCP writes.
- README doctor section documents expected names and MCP-vs-Preset. CONTEXT Preset language may mention `apiKeys` names.

## Testing Decisions

- Good tests assert CLI exit code, stdout/stderr, and `--json` body only. Fake Host supplies env-store names (`listApiKeyNames` / `environmentKeys`), Preset file contents, and agent dest file contents. No tests of Workflow Health internals, translators in isolation, schema files, or Host adapters.
- The module under test is the `dotfiles` CLI via `run(args, fakeHost)`. Prior art: existing doctor tests (missing vs present Workflow, no secret leakage, `--json`, Preset tool toggles, invalid Preset).
- Cover at least: expected name present → `[ok]` and json `{ name, ok: true }`; expected name missing → `[!!]`, exit 1, `isComplete` false; value never appears; `PATH` in the store is not listed; extra non-expected names are not listed; empty `apiKeys` omits the section and `keys: []`; custom Preset `apiKeys` replaces defaults; MCP dest missing → `[!!] MCP`; dest present but servers mismatch Preset → `[!!] MCP`; all four dests match → `[ok] MCP` and a healthy Host can still exit 0; `--help` unchanged; invalid Preset still fails before a report; `isBootstrapped` / continue? still ignores missing keys (init tests that already cover continue? must not start requiring secrets).

## Out of Scope

- `init --dry-run`; `--yes` / `--json` / `--dry-run` on commands that do not already have them
- Custom env-store path discovery in doctor
- New Host methods, including filtering `PATH` inside `listApiKeyNames`
- New commands (`keys`, `mcp`, `package`, `update`, `repair`, `link`)
- Teaching agents to read the Preset themselves; a second hand-maintained per-agent MCP list
- Changing Stow/Sync/init MCP **writes**; doctor is read-only
- Changing `isBootstrapped` to require MCP dests, PATH symlink, Ghostty, or API Keys
- Cleaning leftover `Host.progress`; unit-testing the bash stub; deleting leftover `~/.bun` / `~/.nvm`
- Tool upgrades; pinning versions; snapshotting skills; git config / SSH
- Homebrew, Nix, macOS, Windows, nvim/tmux/Android, work vs personal bundles
- Storing API Key values in the repo or a user-owned `600` secrets file

## Further Notes

- Source: `.scratch/next-feature.md` C1 (recommended) + C2 (folded). Conversation cut: doctor bugs after v2, one spec, existing CLI seam only.
- Seam (confirmed): `run(["doctor"])` / `run(["doctor", "--json"])` + fake Host. No second seam.
- Glossary: Bootstrap, Workflow, Workflow Health, Distro, Stow, Sync, Preset, MCP, API Key, Host.
- Tracker for this repo is `docs/specs/` (no `docs/agents/issue-tracker.md`). Status `ready-for-agent` is the triage label. `/to-tickets` can split next.
