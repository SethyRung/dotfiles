# Extra Mise Tools in the Workflow

Status: done

## Problem Statement

The Stowed mise.toml already installs grok, Codex, gh, and agy on a Fresh Install. `dotfiles doctor` and init's continue? still ignore them, so a machine missing those binaries looks healthy. v2 starts here: those Mise Tools are required Workflow. Config snapshot, MCP translators, and doctor API-Key bugs stay later.

## Solution

Add grok, Codex, gh, and agy to the required Workflow checks and to init's Mise Tools Progress Log detail. Presence is `commandExists`, same as bun/pi/OpenCode. `installMiseTools` after Stow already installs whatever the toml declares. No new commands, no new Host methods, no new Upstream Installs.

## User Stories

1. As a developer on a Fresh Install, I want grok, Codex, gh, and agy installed as Mise Tools so that I do not install them by hand after pi and OpenCode.
2. As a developer, I want those four treated as required Workflow, not optional like Ghostty, so that a Fresh Install missing them is not reported healthy.
3. As a developer, I want `dotfiles doctor` to report each of grok, Codex, gh, and agy present or missing as a required piece.
4. As a developer re-running init, I want continue? to treat a machine missing any of those four as not already Bootstrapped.
5. As a developer watching init, I want the Mise Tools Progress Log row to name agy, bun, Codex, gh, grok, herdr, Node, OpenCode, and pi.
6. As a developer, I do not want a new Upstream Install or Distro package for these four so that mise.toml stays the installer.
7. As a developer, I do not want Grok or Codex config snapshotted in this spec so that secrets and agent-local files stay off the repo.
8. As a developer, I do not want a Grok or Codex MCP translator in this spec so that MCP stays pi + OpenCode until a later v2 cut.
9. As a developer, I want `dotfiles sync` to still skip `installMiseTools` so that ADR 0015 holds.
10. As an implementer, I want all of the above observable through `run()` against a fake Host.

## Implementation Decisions

- Binding: ADR 0020 (amends 0016), ADR 0015 (sync never upgrades), ADR 0019 (MCP still pi + OpenCode).
- One module: the `dotfiles` CLI. Host already has `commandExists` and `installMiseTools`.
- `src/consts/workflow-tools.ts` gains grok, Codex, gh, and agy. `requiredWorkflowTools` includes them. Doctor and `isBootstrapped` follow that list.
- Init Mise Tools detail is one shared string from that const, not a second inventory.
- Stow junk, zshrc PATH, and agent config trees are unchanged.

## Testing Decisions

- Tests call `run()` with `createFakeHost`. Cover: empty doctor lists the four as required failures; a Host with the previous complete command set is no longer 16/16; missing grok is not continue?; mise.toml still declares the four; Progress Log Mise Tools detail includes them; sync still does not call `installMiseTools`.
- No tests of private helpers.

## Out of Scope

- Grok or Codex config snapshot, auth, sessions, or local skills
- MCP translators for Grok or Codex
- `init --yes`, `doctor --json`, `--version`, completions
- Doctor expected API Key names
- Ghostty on zypper
- New CLI commands; tool upgrades; macOS / Windows; nvim/tmux/Android

## Further Notes

- v2 feature cut: membership first. Snapshot and MCP later.
- Grill: required like OpenCode; installer is mise.toml; doctor via `commandExists`.
