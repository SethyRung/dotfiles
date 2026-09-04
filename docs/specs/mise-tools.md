# Mise Tools for bun, Node, herdr, pi, and OpenCode

Status: done

## Problem Statement

Bootstrap still curl-pipes bun, herdr, pi, OpenCode, and nvm, while this machine already uses mise for some of those binaries. Two version managers, leftover bun.com/nvm PATH, and official install scripts that mise already covers. The developer wants mise as the installer for those CLI Workflow binaries, with mise itself self-updating, without turning Ghostty, Zed, or Oh My Zsh into mise packages.

## Solution

mise is an Upstream Install. bun, Node, herdr, pi, and OpenCode become Mise Tools declared in a Stowed global mise config (`latest`, Node `lts`, `auto_update` on for mise’s own binary). The bash stub chicken-eggs mise then bun when bun is missing. `dotfiles init` Upstream-Installs mise if missing, Stows (so the mise config is in `$HOME`), then always `installMiseTools`. Distro Package Map, optional Ghostty, Zed, Oh My Zsh, and OMZ plugins stay as they are. nvm goes away. `dotfiles sync` still never upgrades tools.

## User Stories

1. As a developer on a Fresh Install with no bun, I want the bash stub to Upstream-Install mise from mise.run so that bun can be a Mise Tool instead of bun.com/install.
2. As a developer on a Fresh Install with no bun, I want the stub to `mise use -g bun@latest` after mise is on PATH so that the TypeScript CLI can exec.
3. As a developer whose bun is already on PATH, I want the stub to skip mise and bun and exec the CLI so that re-runs are not slower than they need to be.
4. As a developer, I want mise installed to `~/.local/bin` (mise.run default) so that `auto_update` works and Distro mise (which often disables self-update) is not used.
5. As a developer whose current bash session has no `~/.local/bin` on PATH, I want the stub to put it on PATH after installing mise so that `mise` and then `bun` are found before exec.
6. As a developer on a machine that already has bun.com bun but no mise, I want `dotfiles init` to Upstream-Install mise anyway so that the stub’s “bun present → skip” path does not leave mise missing.
7. As a developer whose mise is already present, I want init to skip the mise Upstream Install so that a re-run is not noisy.
8. As a developer, I want fail-fast if the mise Upstream Install fails so that Bootstrap does not pretend Mise Tools can install.
9. As a developer, I want the global mise config Stowed from the home tree so that the Mise Tool list is reviewable in git and is the source of truth on every machine.
10. As a developer, I want that config to declare bun, herdr, pi, and OpenCode as `latest` and Node as `lts` so that versions match the grill (floating, not pins, not a lockfile).
11. As a developer, I want `auto_update = true` in that Stowed config so that mise’s own binary updates on a ~7d cadence without a CLI command.
12. As a developer, I do not want gh, codex, grok, or any other extra mise tools in that committed file so that Fresh Install Workflow stays the five Mise Tools.
13. As a developer on this machine whose live mise config has extra tools, I accept that the next Stow replaces that file so that git wins over local extras.
14. As a developer, I want init to Stow before installing Mise Tools so that `mise install` reads the Stowed config in `$HOME`.
15. As a developer, I want init to always request `installMiseTools` after that Stow so that a leftover bun.com bun on PATH cannot skip mise’s bun.
16. As a developer whose Mise Tools are already installed at the versions mise would select, I want `installMiseTools` to no-op quietly so that re-runs are not noisy (mise’s own idempotency, not `commandExists`).
17. As a developer, I do not want init to run `mise upgrade` so that `latest` does not move forward on every Bootstrap (ADR 0015 spirit for init).
18. As a developer, I want bun, herdr, pi, OpenCode, and nvm removed from the Upstream Install table so that those curl-pipes are not requested.
19. As a developer, I want Oh My Zsh, OMZ plugins, and Zed to stay Upstream Installs so that GUI/app and git-cloned shell plugins are not forced through mise.
20. As a developer, I want zsh, git, stow, and optional Ghostty to stay Distro Package Map so that ADR 0001/0004 Distro support is unchanged.
21. As a developer, I want nvm never installed so that Node is only a Mise Tool.
22. As a developer, I want npm to come from mise’s Node so that `pi install npm:…` and skills.sh still have npm without Distro npm or nvm.
23. As a developer, I want pi packages still installed through the Host after Mise Tools so that the agent plugins exist once pi is a Mise Tool.
24. As a developer whose pi command already existed before `installMiseTools`, I want pi packages skipped so that re-runs match today’s skip-if-present rule for that step.
25. As a developer whose pi was missing before `installMiseTools`, I want pi packages installed after mise brings pi in so that a Fresh Install is not an empty pi.
26. As a developer, I want the Progress Log to drop the nvm / herdr / OpenCode Upstream rows and show mise (if needed), Stow, Mise Tools, then pi packages so that the dashboard matches the new order.
27. As a developer watching init, I still want Zed, Skills, MCP, API Keys, Ghostty, login shell, and the CLI PATH symlink as today so that only the installer class for those five binaries changed.
28. As a developer, I want the curated zshrc to `eval "$(mise activate zsh)"` with no username-hardcoded path so that a Fresh Install activates mise.
29. As a developer, I want that activate after Oh My Zsh is sourced so that mise owns tool PATH.
30. As a developer, I do not want `BUN_INSTALL`, herdr’s install-dir PATH, or `~/.opencode/bin` in zshrc so that bun.com / old Upstream bins cannot shadow Mise Tools.
31. As a developer, I want `~/.local/bin` still on PATH in zshrc so that `mise` and `dotfiles` are found.
32. As a developer, I want the OMZ `nvm` plugin removed so that zshrc does not load a version manager we no longer install.
33. As a developer, I want OMZ `npm` and `node` plugins kept if they are already in the curated list so that this spec does not restyle unrelated zsh plugins.
34. As a developer, I want zsh-autosuggestions and zsh-syntax-highlighting to remain git-cloned OMZ plugins so that they are not Mise Tools.
35. As a developer with leftover `~/.bun` or `~/.nvm` directories, I want init to leave them on disk so that Bootstrap is not a destructive cleanup.
36. As a developer, I want `dotfiles doctor` to keep reporting bun, npm, pi, herdr, and OpenCode as required so that missing Mise Tools still fail doctor.
37. As a developer, I want doctor to report mise present or missing as required so that a machine with leftover bun.com bun but no mise is visible.
38. As a developer, I do not want doctor to mention nvm so that the old installer is gone from the dashboard.
39. As a developer, I want doctor still treating Ghostty as optional so that this spec does not change Ghostty.
40. As a developer running doctor from bash without having sourced zshrc, I want `commandExists` on the real Host to see Mise Tools in mise’s install dirs (and `~/.local/bin`) so that a curated PATH is not required to get `[ok]`.
41. As a developer, I do not want the real Host to treat leftover `~/.bun`, `~/.nvm`, or `~/.opencode/bin` as installed so that doctor does not lie after PATH ownership moved to mise.
42. As a developer, I want `workflowLooksPresent` / continue? to treat mise plus the five Mise Tools as required (via the same command/file checks doctor uses) so that a machine missing mise is not “already present.”
43. As a developer, I want `dotfiles sync` unchanged: pull, Stow, MCP mirror, never `installMiseTools` or mise upgrade so that ADR 0015 holds.
44. As a developer, I want `dotfiles stow` to link the mise config like any other home-tree file so that a repo move retargets it.
45. As a developer, I want tool upgrades after Bootstrap to be `mise upgrade` (or each tool’s self-update) by hand so that neither init nor sync bumps `latest`.
46. As a developer reading `dotfiles --help`, I do not need a new command so that v1 commands stay init, doctor, stow, clean, sync.
47. As an implementer, I want all of the above observable through `run(args, host)` against a fake Host so that tests never exec the stub or real mise.
48. As an implementer, I want a Host method `installMiseTools` so that tests can assert `mise install` was requested without calling it an Upstream Install.
49. As an implementer, I want mise itself to use existing `runUpstreamInstall("mise")` so that no second installer seam appears.
50. As an implementer, I do not want unit tests of the bash stub so that the Host remains the only seam (stub is chicken-egg only).

## Implementation Decisions

- Respect ADRs 0001–0016 and `CONTEXT.md`. Command is `dotfiles`. Distro via Package Map. mise, Zed, Oh My Zsh, OMZ plugins are Upstream Installs. bun, Node, herdr, pi, OpenCode are Mise Tools (0016). Node is not nvm (0013 superseded). Stub installs mise then bun (0005). Sync never upgrades tools (0015). Skills via skills.sh; MCP is the XDG file. No pi model restore.
- One user-facing module: the `dotfiles` CLI. No new commands. No parallel installer.
- One seam: Host. Add `installMiseTools()`; production runs `mise install`. Fake Host records the call. mise itself is `runUpstreamInstall("mise")` (mise.run). Do not overload Upstream Install for `mise install`.
- `run()` does not curl-install bun. The stub is the chicken-egg. Tests that need bun inject it. Doctor on an empty Host reports bun missing instead of installing it as a side effect.
- Init order: Distro packages → Oh My Zsh → OMZ plugins → mise if missing → Stow (Ghostty config still delayed until the Ghostty prompt, as today) → `installMiseTools` always → pi packages if pi was missing before that call → Zed Upstream if missing → Skills → MCP mirror → API Keys → Ghostty prompt → login shell → PATH symlink.
- Stow of the mise config is part of the normal home tree (not a second tree). Committed tools: bun/herdr/pi/opencode `latest`, node `lts`, settings `auto_update = true`. Nothing else.
- Progress Log: replace the nvm + herdr + OpenCode Upstream steps with mise, Stow (already existed, now earlier), Mise Tools, and pi packages. Keep Zed and the rest. Footer step count follows the new list. Same dashboard rules (TTY vs piped, no API Key values).
- Curated zshrc: drop OMZ `nvm`; drop bun/herdr/opencode PATH exports; `eval "$(mise activate zsh)"` after Oh My Zsh; keep `~/.local/bin` on PATH. Do not hardcode a username.
- Real Host `commandExists`: PATH, then `~/.local/bin`, then mise install dirs. Stop special-casing `~/.bun/bin`, `~/.opencode/bin`, and nvm. Fake Host still uses the injected command set only.
- Do not delete `~/.bun` or `~/.nvm`.
- Fail fast if mise Upstream Install or `installMiseTools` fails.
- Tests never hit real mise, network, apt, or `/etc/environment`.

## Testing Decisions

- Good tests assert external behaviour only: CLI exit code, user-visible output, and Host effects (Upstream Installs requested, `installMiseTools` called, packages, Stow links, prompts, progress step labels/states). No tests of private helpers, mise.toml parsing in isolation, or the bash stub.
- The only module under test is the `dotfiles` CLI with a fake Host. Cover at least: init Upstream-Installs mise when missing and skips when present; init never requests nvm, bun, herdr, pi, or OpenCode as Upstream Installs; init always calls `installMiseTools` even when bun/npm/herdr/pi/opencode commands already exist; Stow includes the mise config; zshrc activates mise and does not contain nvm, bun.com PATH, herdr install-dir PATH, or OpenCode bin PATH; doctor reports mise and still reports bun/npm/pi/herdr/OpenCode; doctor does not mention nvm; sync does not call `installMiseTools`; pi packages still requested when pi was missing, skipped when pi was already present; continue? still works; unknown Distro still fails before installs.
- Prior art: existing CLI tests for nvm/herdr/pi/OpenCode Upstream Installs, curated zshrc PATH assertions, Progress Log final-step maps, and Stow of config files. Those nvm/herdr/OpenCode-upstream and old PATH assertions are replaced, not left failing.

## Out of Scope

- Installing Ghostty, Zed, Oh My Zsh, or OMZ plugins via mise
- Distro-packaging mise, or using mise bootstrap for zsh/git/stow
- Pinning Mise Tool versions, mise.lock, or `mise upgrade` from `dotfiles init` / `dotfiles sync`
- Deleting leftover `~/.bun` / `~/.nvm`
- Preserving extra live mise tools (gh, codex, grok) across Stow
- New CLI commands (`package`, `update`, `mise`)
- Unit-testing the bash stub or talking to real mise
- Changing API Keys, Skills, MCP mirror, Ghostty prompt, login shell, or Stow backup rules except where order requires Stow before Mise Tools
- macOS / Windows / Homebrew / Nix

## Further Notes

- Grill settled: CLI tools only through mise; Node `lts`; OMZ plugins stay git; stub mise then bun; Stowed mise.toml; latest + node lts; sync/init do not upgrade tools; Workflow five only; mise owns zshrc PATH; leave leftover dirs; init installs mise if missing; always `mise install` after Stow.
- ADRs: 0016, amended 0004/0005, superseded 0013. Glossary: Mise Tool, OMZ plugin, Upstream Install no longer lists bun/herdr/pi/OpenCode/nvm.
- Seam: Host only (`installMiseTools` + existing `runUpstreamInstall("mise")`). Confirmed before this spec.
- Tracker for this repo is `docs/specs/` (no `docs/agents/issue-tracker.md`). Status `ready-for-agent` is the triage label. `/to-tickets` can split next.
