# Generated agent-hook files are never Stowed

Codex `hooks.json` and `herdr-agent-state.sh`, and OpenCode `tui.json`, `tui.jsonc`, `herdr-tui-session.js`, and `plugins/herdr-agent-state.js`, are integration output rather than personal config. herdr writes them and states in each file that reinstalling or updating the integration overwrites it; the Codex `hooks.json` is likewise a hook registry that herdr and orca each rewrite when they install their hooks. Snapshotting them Stows a stale copy over the version the installed integration just wrote, and a Fresh Install that has no herdr or orca binary would link hook commands that point at nothing — the same failure ADR 0012 avoided for `~/.pi/agent/extensions/`.

They are therefore not files under `home/`. herdr restores its own: `herdr integration install codex` and `herdr integration install opencode`, which also rewrite the Codex `hooks.json` entry and the OpenCode TUI config that reference them. orca re-registers its own Codex hook entries through its agent-hook install. Bootstrap never invents, refreshes, or removes these files; a missing one stays missing until its tool reinstalls it.

Stow still filters the paths, so a hand-copied stray under `home/` is skipped instead of linked, and `.gitignore` keeps an accidental copy out of a commit. Curated Codex `config.toml` and OpenCode `opencode.json` remain Stowed as before.

Amends ADR 0011 and ADR 0021, which Stowed the herdr plugin and hook files and Codex `hooks.json`, and ADR 0031's rule that OpenCode, Grok, and Codex configs all stay curated Stow files. Retains ADR 0012's generated-file delivery policy.
