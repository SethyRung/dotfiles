# OpenCode in the Workflow

Status: done

## Problem Statement

After a Fresh Install, Bootstrap restores pi but not OpenCode. The developer already uses OpenCode on this machine (binary, TUI, herdr plugins, same MCP servers as pi). Restoring that by hand is easy to get wrong: install the agent, Stow the right config, skip secrets and Android-local skills, and keep MCP in one place so pi and OpenCode do not drift.

## Solution

OpenCode becomes a required Workflow piece. `dotfiles init` Upstream-Installs latest OpenCode, Stows its config and herdr plugins, puts OpenCode's bin dir on PATH in the curated zshrc, and mirrors the XDG MCP list into OpenCode's `mcp` key. `dotfiles doctor` reports whether OpenCode is present. Local OpenCode skills, auth, sessions, caches, `node_modules`, and default model/provider are never restored.

## User Stories

1. As a developer on a Fresh Install, I want OpenCode installed as part of Bootstrap so that I do not install it by hand after pi.
2. As a developer, I want OpenCode treated as required Workflow, not optional like Ghostty, so that a Fresh Install is not missing an agent I always use.
3. As a developer, I want OpenCode installed via its official Upstream Install (always latest) so that Bootstrap does not pin a version or use a Distro package.
4. As a developer whose OpenCode is already present, I want init to skip that Upstream Install quietly so that a re-run is not noisy.
5. As a developer, I want OpenCode global config Stowed so that permissions and autoupdate match this machine.
6. As a developer, I want OpenCode TUI config Stowed so that TUI prefs and the herdr TUI plugin load on a Fresh Install.
7. As a developer, I want herdr's OpenCode plugin files Stowed so that herdr integration works without a separate herdr reinstall step.
8. As a developer, I do not want `~/.config/opencode/skills/` snapshotted so that Skills stay global via skills.sh and Android-local skills stay out of v1.
9. As a developer, I do not want OpenCode auth, sessions, caches, databases, or `node_modules` in the repo so that secrets and junk never get committed.
10. As a developer, I do not want OpenCode default model or provider restored so that a Fresh Install keeps OpenCode's own defaults (same spirit as pi).
11. As a developer, I want the XDG MCP file to remain the only MCP list so that I do not maintain two server lists.
12. As a developer, I want those XDG MCP servers mirrored into OpenCode's `mcp` key during Bootstrap so that OpenCode sees the same servers even though it cannot read the XDG file.
13. As a developer who adds or changes an MCP server in the XDG file, I want a re-run of init to refresh OpenCode's `mcp` key from that list so that the two views do not drift.
14. As a developer, I do not want a hand-maintained OpenCode-only MCP list so that pi and OpenCode cannot silently diverge.
15. As a developer, I want bun, nuxt, nuxt-ui, better-auth, and mobile-mcp to appear for OpenCode after Bootstrap so that the mirrored list matches the XDG file this machine already has.
16. As a developer, I want `~/.opencode/bin` on PATH in the curated zshrc so that new terminals find `opencode` without extra setup.
17. As a developer whose current bash session does not yet have that PATH, I still want init to succeed so that the next zsh session finds OpenCode.
18. As a developer, I want `dotfiles doctor` to report OpenCode present or missing as a required piece so that I can see if Bootstrap missed the agent.
19. As a developer, I want doctor to treat missing OpenCode as a failure (not an optional warning) so that it is not confused with Ghostty.
20. As a developer re-running init when the Workflow already looks present, I want the existing continue? prompt to include OpenCode in "already present" so that a machine with everything except OpenCode is not treated as done.
21. As a developer who continues an idempotent init, I want OpenCode skipped if already installed so that only missing pieces are requested.
22. As a developer who continues, I still want MCP mirror and Stow conflict confirmation so that OpenCode config is not overwritten blindly and MCP stays in sync.
23. As a developer, I want Stow junk rules to skip OpenCode auth, sessions, logs, sockets, and caches so that `dotfiles stow` cannot leak secrets.
24. As a developer, I want fail-fast if the OpenCode Upstream Install fails so that I am not left thinking the Workflow is complete.
25. As an implementer, I want all of the above observable through the `dotfiles` CLI against a fake Host so that tests do not need a real OpenCode install or network.

## Implementation Decisions

- Respect ADRs 0001–0011 and `CONTEXT.md`. OpenCode is required Workflow. MCP is the XDG file; OpenCode's `mcp` key is a mirror (0010). Snapshot is config + herdr plugins, not local skills (0011). No model/auth restore (0008 spirit). Skills via skills.sh (0007). Command is `dotfiles`. Tests through the CLI with a fake Host.
- One module: the `dotfiles` CLI. No new commands. No new seam: Host already covers Upstream Install, Stow, doctor checks, prompts.
- Add OpenCode to the Upstream Install table (official install, always latest). Init requests it after pi, skips if the OpenCode command already exists.
- Stow OpenCode global config, TUI config, and herdr plugin files from the single `home/` tree. Do not Stow OpenCode-local skills, auth, sessions, caches, databases, or `node_modules`.
- After XDG MCP is in place, init writes a translated `mcp` key into OpenCode config: same server names and endpoints as the XDG list, in OpenCode's shape (`type` local/remote, `command` as one array). Do not keep a second hand-edited list in the repo as source of truth.
- Curated zshrc adds OpenCode's bin directory to PATH (alongside bun, herdr, and `~/.local/bin`).
- Doctor: OpenCode missing is required failure, same class as pi, not Ghostty's optional warning.
- `workflowLooksPresent` / continue? treats OpenCode as required, same as pi.
- Fail fast on OpenCode Upstream Install failure. Mirror/Stow of OpenCode config follows existing backup-then-Stow and re-run conflict confirmation.

## Testing Decisions

- Good tests assert external behaviour only: CLI exit code, user-visible output, and Host effects (Upstream Install requested or skipped, OpenCode config Stowed, MCP names present in OpenCode's `mcp` key and matching XDG, PATH text in zshrc, doctor missing vs present, junk not linked). No tests of private helpers or MCP translation in isolation.
- The only module under test is the `dotfiles` CLI with a fake Host. Cover: init requests OpenCode; skip when present; doctor missing/present; XDG servers appear in OpenCode `mcp`; local skills/auth not Stowed; zshrc PATH; continue? not true without OpenCode; continue skips OpenCode if present.
- Prior art: tickets 06–10 in this repo (herdr/pi Upstream Install + Stow, XDG MCP, optional Ghostty, idempotent continue).

## Out of Scope

- Optional OpenCode (Ghostty-style prompt)
- Snapshotting OpenCode-local `skills/` or Android skills
- A second hand-maintained OpenCode MCP list, or teaching OpenCode to read the XDG file itself
- Restoring OpenCode auth, sessions, caches, databases, `node_modules`, default model, or provider
- Distro-packaging OpenCode or pinning its version
- Changing v1 commands, adding `dotfiles update` / `package` / `link`
- nvim, tmux, Android SDK, and the rest of the Yoga 9 toolchain
- Making pi consume OpenCode config, or unifying the two agents beyond shared XDG MCP and global Skills

## Further Notes

- Grill settled: required like pi; MCP mirror A (ADR 0010); Stow config + herdr (ADR 0011); PATH via zshrc.
- OpenCode on this machine already has no `mcp` key and no default model; those absences are the intended Fresh Install baseline except for the mirrored MCP.
- Issue tracker for this repo is local files (`docs/specs/`, `.scratch/…/issues/`). No `docs/agents/issue-tracker.md`; `/to-tickets` can split this spec next.
