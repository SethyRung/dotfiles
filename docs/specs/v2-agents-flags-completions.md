# v2 Grok/Codex snapshot, flags, completions, Ghostty on zypper

Status: done

## Problem Statement

v2 already treats grok, Codex, gh, and agy as required Mise Tools, but a Fresh Install still does not restore Grok or Codex config and still does not give those agents the Workflow MCP list. Bootstrap still cannot run unattended: continue?, `.env` modify, store location, write confirm, Ghostty, Stow overwrite, and reboot all block. zsh does not complete `dotfiles`. Ghostty on zypper still warns and skips even though a Distro package named `ghostty` exists. doctor has no machine-readable output, and the CLI has no `--version`.

## Solution

Grow the existing five commands and the Host Stow/MCP path in place. Stow curated Grok and Codex config (OpenCode-shaped: config and herdr hooks, not auth, sessions, or local skills). Add Grok and Codex as MCP translators from the canonical list, refreshed on init, real Stow, and Sync. Add `--yes` on init and clean, `--json` on doctor, top-level `--version`, and a Stowed zsh completion. Map Ghostty on zypper to `ghostty`. gh and agy stay CLIs. No sixth command. No tool upgrades.

## User Stories

1. As a developer on a Fresh Install, I want curated Grok config Stowed so that theme, installer, marketplace sources, and permission prefs match this machine without copying secrets by hand.
2. As a developer on a Fresh Install, I want curated Codex config Stowed so that hooks and herdr integration load without a separate Codex setup step.
3. As a developer, I want Grok and Codex treated as required Workflow agents for snapshot and MCP, not optional like Ghostty, so that a Fresh Install is not missing agents I always use.
4. As a developer, I do not want Grok `auth.json`, sessions, logs, caches, binaries, bundled trees, sqlite, locks, or privacy-banner timestamps in the repo so that secrets and ephemeral files never get committed.
5. As a developer, I do not want Codex sqlite, tmp, `installation_id`, or local `skills/` in the repo so that secrets, junk, and agent-local skills stay off Dotfiles.
6. As a developer, I do not want Grok or Codex default model or provider restored so that a Fresh Install keeps each agent's own defaults (same spirit as pi and OpenCode).
7. As a developer, I want Skills to stay global via skills.sh so that Grok and Codex do not get a second skill tree in `home/`.
8. As a developer, I want gh and agy to remain Mise Tool CLIs with no Stowed config and no MCP translator so that only agents get agent treatment.
9. As a developer, I want the canonical MCP list translated into Grok's `mcp_servers` shape (url or command plus args) so that Grok sees the same servers as pi and OpenCode.
10. As a developer, I want the canonical MCP list translated into Codex's native MCP shape so that Codex sees those same servers.
11. As a developer running `dotfiles init`, I want Grok and Codex MCP written after Stow so that Bootstrap ends with four consistent agent views of one list.
12. As a developer running real `dotfiles stow`, I want Grok and Codex MCP refreshed so that I do not need Sync's pull or a full init after editing the canonical list.
13. As a developer running real `dotfiles sync`, I want Grok and Codex MCP refreshed after pull and Stow so that Sync still matches pull, then Stow, then MCP.
14. As a developer running `dotfiles stow --dry-run` or `dotfiles sync --dry-run`, I want no Grok or Codex MCP write so that preview cannot drift agent config.
15. As a developer whose canonical MCP list is missing, I want Grok and Codex MCP writes skipped so that a partial tree does not invent agent config.
16. As a developer, I do not want a hand-maintained Grok-only or Codex-only MCP list so that agents cannot silently diverge (ADR 0019).
17. As a developer, I want Stow junk rules to skip Grok auth, sessions, logs, caches, binaries, sqlite, and similar so that `dotfiles stow` cannot leak secrets from a live `~/.grok`.
18. As a developer, I want Stow junk rules to skip Codex sqlite, tmp, `installation_id`, and local skills so that `dotfiles stow` cannot leak Codex junk.
19. As a developer watching init, I want the MCP Progress Log row to name pi, OpenCode, Grok, and Codex so that the four translations are visible.
20. As a developer, I want existing pi and OpenCode MCP translations to keep working so that this spec only adds translators.
21. As a developer, I want `dotfiles init --yes` to treat an already-present Workflow as continue-yes so that unattended re-runs do not block on `[y/N]`.
22. As a developer running `dotfiles init --yes` when a repo `.env` exists, I want those variables used as-is (no modify/override/append prompts) so that unattended Bootstrap can load keys from the file.
23. As a developer running `dotfiles init --yes` when no `.env` exists, I want the API Key step skipped so that unattended Bootstrap does not wait for CSV.
24. As a developer running `dotfiles init --yes` with keys to write, I want the default store location (`/etc/environment`) used without a menu so that unattended Bootstrap does not wait for store choice.
25. As a developer running `dotfiles init --yes` with keys to write, I want the write treated as confirmed so that unattended Bootstrap can merge without a second `[y/N]`.
26. As a developer running `dotfiles init --yes` when Ghostty is not preset-enabled, I want Ghostty skipped (default no) so that unattended Bootstrap does not install an optional terminal.
27. As a developer running `dotfiles init --yes` when the Preset enables Ghostty, I want Ghostty installed without a prompt so that `--yes` does not override an explicit Preset.
28. As a developer running `dotfiles init --yes` when Stow would conflict, I want existing files overwritten (backup-then-link) without a prompt so that unattended Bootstrap can finish.
29. As a developer running `dotfiles init --yes`, I want no reboot prompt so that unattended Bootstrap cannot reboot the machine.
30. As a developer running `dotfiles init --yes` on an unknown Distro, I still want fail-fast before any install so that `--yes` cannot half-bootstrap.
31. As a developer reading `init` help, I want `--yes` documented so that unattended Bootstrap is discoverable.
32. As a developer who passes `init --yes --help`, I want help to win and no work to run so that help stays safe.
33. As a developer who passes `-y` to init, I want a non-zero exit and no work so that short unknown flags stay rejected (long `--yes` only, same as `--dry-run`).
34. As a developer running `dotfiles clean --yes` with backups present, I want those backups deleted without a confirm prompt so that cleanup can be unattended.
35. As a developer running `dotfiles clean --yes` with no backups, I want the existing no-op so that `--yes` does not invent deletions.
36. As a developer who passes `--yes` to `stow`, `sync`, or `doctor`, I want a non-zero exit and no work so that `--yes` stays init and clean only.
37. As a developer whose Preset already disables Ghostty, skills, Zed, or similar, I want `--yes` to still honor those Preset toggles so that unattended Bootstrap does not re-enable skipped tools.
38. As a developer in zsh, I want `dotfiles <TAB>` to complete `init`, `doctor`, `stow`, `clean`, and `sync` so that I do not have to remember the five names.
39. As a developer in zsh, I want flag completion for `--help`, `--dry-run`, `--yes`, `--json`, and `--version` on the commands that accept them so that flags are discoverable.
40. As a developer, I do not want a `completions` command so that completions are Stowed config, not a sixth CLI surface.
41. As a developer reading top-level help, I do not want `completions`, `update`, `repair`, `package`, or `link` listed so that rejected names stay gone.
42. As a developer on a Fresh Install, I want the curated zshrc to put the Stowed completions directory on `fpath` so that new zsh sessions complete `dotfiles` without extra setup.
43. As a developer, I do not want Fish or bash completions in this spec so that v2 stays zsh Workflow.
44. As a developer who answers yes to Ghostty on zypper, I want the Distro package `ghostty` installed and its config Stowed so that zypper matches apt/pacman/dnf.
45. As a developer on zypper who declines Ghostty, I want both the package and the config skipped so that optional Ghostty stays optional.
46. As a developer, I want apt, pacman, and dnf Ghostty mappings unchanged so that this spec only fills the zypper hole.
47. As a developer, I want missing Ghostty to remain a doctor warning, not a required failure, including on zypper.
48. As a developer, I want the Ghostty prompt default to remain no so that `--yes` and a Fresh Install still do not force Ghostty.
49. As a developer running `dotfiles doctor --json`, I want stdout to be JSON of Workflow Health (required checks, optional Ghostty, API Key names, broken Stow links, completeness) so that I can script health.
50. As a developer running `dotfiles doctor --json`, I want the same exit code as human doctor (zero iff required checks pass and there are no broken Stow links) so that scripts can branch on status.
51. As a developer running `dotfiles doctor` with no flags, I want the existing human dashboard so that `--json` is opt-in.
52. As a developer running `dotfiles doctor --json`, I never want API Key values in the JSON so that secrets cannot leak into scripts or logs.
53. As a developer reading doctor help, I want `--json` documented so that the flag is discoverable.
54. As a developer who passes `doctor --json --help`, I want help to win and no work to run.
55. As a developer who passes `--json` to init, stow, clean, or sync, I want a non-zero exit and no work so that `--json` stays doctor only.
56. As a developer running `dotfiles --version`, I want a version string on stdout and exit zero so that I can see which CLI I am running.
57. As a developer running `dotfiles --version`, I want no Host writes and no installs so that version cannot change the machine.
58. As a developer reading top-level help, I want `--version` documented so that it is discoverable.
59. As a developer who passes `--version` together with `--help` at top level, I want help to win so that help stays the documentation path.
60. As a developer who passes `--version` after a command, I want a non-zero unknown-option exit so that version stays top-level only.
61. As a maintainer, I want the version string committed in package metadata so that tests can assert it without talking to git.
62. As a developer writing tests, I want every new behavior observed through the CLI against a fake Host so that internals stay free to move.
63. As a developer, I want unknown Distro, Mise Tools install-after-Stow, and Sync-never-upgrades behavior unchanged so that this spec does not reopen ADR 0001, 0015, 0016, or 0020.
64. As a maintainer, I want README command copy to mention `--yes`, `--json`, `--version`, zsh completions, Grok/Codex snapshot, and Ghostty on zypper so that the user-facing doc matches the CLI.

## Implementation Decisions

- Host remains the only seam. Do not add a second interface, a parallel CLI, or a sixth command. Commands stay `init`, `doctor`, `stow`, `clean`, `sync`.
- No new Host methods. Snapshot is the existing home-tree Stow. MCP translators use existing read/write. Flags are dispatcher argv. Completions are Stowed files plus curated zshrc `fpath`. Ghostty is Package Map. Version is dispatcher-only.
- Binding: ADR 0019 (canonical MCP list; a new agent is one more translator), ADR 0020 (grok/Codex/gh/agy are required Mise Tools; this spec is the snapshot/MCP cut 0020 deferred), ADR 0008/0011/0012 spirit (config snapshot, not model/auth/extensions/local skills), ADR 0015 (Sync never upgrades), ADR 0018 (Preset still wins over prompts), ADR 0004 (Ghostty via Package Map).
- Add an ADR for Grok and Codex snapshot: curated config plus Codex herdr hooks; not auth, sessions, caches, binaries, sqlite, local skills, or default model/provider. gh and agy are not snapshotted.
- Grok MCP shape: per-server tables with `url` for remote and `command` plus `args` for local. Codex MCP shape: that agent's native config, merged without wiping unrelated keys (same merge style as OpenCode's `mcp` key and pi's `mcpServers`).
- Real init, Stow, and Sync call the existing MCP mirror helper, which gains Grok and Codex writers beside pi and OpenCode. Dry-run Stow and Sync still must not write any agent MCP.
- `--yes` is the long flag only on `init` and `clean`. Answers: continue yes; `.env` unmodified when present, skip keys when absent; default env store; write confirm yes when there are keys; Ghostty no unless Preset enables it; Stow overwrite yes; reboot no. Preset toggles still apply. Fail-fast on unknown Distro still applies.
- `--json` is the long flag only on `doctor`. Human dashboard remains the default. JSON is the Workflow Health struct already used for doctor (checks, optional Ghostty, key names, broken links, completeness). Exit code unchanged. Values of API Keys never appear.
- `--version` is top-level only (before command dispatch), long flag. Stdout is the committed package version plus a newline. Exit 0. No Host calls. Combined with top-level `--help` / `-h`, help wins.
- zsh completions are a Stowed completion function covering the five commands and the flags each command accepts. Curated zshrc prepends that directory to `fpath` before Oh My Zsh loads. No `completions` command. No Fish or bash.
- Ghostty Package Map gains zypper → `ghostty` (openSUSE Tumbleweed OSS name). apt/pacman/dnf stay `ghostty`. Optional warning path remains only when a mapping is still missing.
- `--help` / `-h` still wins over other flags on a command. Unknown flags and extra positionals still exit 1 with no Host writes. Top-level help still must not mention `update`, `repair`, `package`, `link`, or `completions`.
- Init Progress Log stays the dashboard (no file-by-file Stow dump). MCP row text names the four agents.

## Testing Decisions

- Good tests assert CLI exit code, stdout/stderr, and fake Host effects only (links, backups, PATH stub, MCP file contents for pi/OpenCode/Grok/Codex, packages requested including zypper Ghostty, prompts skipped under `--yes`, doctor JSON shape and key names without values, version stdout, zshrc `fpath` text, junk not linked). No unit tests of translators, flag parsers, or completion scripts in isolation.
- The module under test is the `dotfiles` CLI via `run(args, fakeHost)`. Cover at least: Grok/Codex config linked and secrets/junk not linked; Grok and Codex MCP names match the canonical list after init/stow/sync; dry-run writes no Grok/Codex MCP; `init --yes` issues no prompts and still fail-fasts unknown Distro; `init --yes` skips Ghostty unless Preset enables it; `clean --yes` deletes without prompt; `--yes`/`--json` on the wrong command exits 1; `doctor --json` exit code matches human doctor and never contains secret values; `dotfiles --version` exits 0 with no Host writes; zypper Ghostty yes requests `ghostty`; help documents the new flags and still omits rejected command names; existing OpenCode/pi MCP and help/dry-run tests stay green.
- Prior art: OpenCode snapshot and junk tests; MCP-on-stow/init/sync tests; `--help` / `--dry-run` dispatcher tests; Ghostty yes/no/zypper-warn tests; doctor required vs optional tests; Preset skip-prompt tests.

## Out of Scope

- New commands (`completions`, `mcp`, `package`, `update`, `repair`, `link`, `unlink`, `edit`, `mise`, `help` as a command, `version` as a command)
- Doctor expected API Key names; filtering `PATH` out of doctor; custom env-store discovery in doctor
- Tool upgrades; renaming Sync; pinning Mise Tool versions
- Snapshotting Skill files, OpenCode-local skills, pi model/provider, pi `extensions/`, Grok bundled skills, Codex-local skills
- A second hand-maintained per-agent MCP list; teaching Grok or Codex to read the canonical file themselves
- Fish/bash completions; `-y` / `-n` / `-V` short flags
- `--yes` on stow/sync/doctor; `--json` on init/stow/clean/sync; `--dry-run` on init
- Homebrew, Nix, macOS, Windows, nvim/tmux/Android, git config/SSH, work vs personal bundles
- Cleaning leftover Host progress-frame method; deleting leftover `~/.bun` / `~/.nvm`

## Further Notes

- Conversation cut: v2 features first, bugs later. This spec is that feature cut. Membership of grok/Codex/gh/agy already shipped (ADR 0020).
- Grill: Host only; five commands; MCP translators not new lists; `--yes` long flag; completions Stowed not a command; zypper Ghostty is `ghostty`.
- Glossary: Bootstrap, Distro, Workflow, Stow, Sync, Package Map, Upstream Install, Mise Tool, Skill, MCP, API Key, Progress Log, Preset, Grok, Codex, Host.
- Tracker for this repo is `docs/specs/` (no `docs/agents/issue-tracker.md`). Status `ready-for-agent` is the triage label. `/to-tickets` can split next.
