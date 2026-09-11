# 05: Grok and Codex MCP translators

**What to build:** Init, real Stow, and Sync translate the canonical MCP list into Grok and Codex native shapes (Grok: per-server `url` or `command` plus `args`; Codex: merge into that agent's config without wiping unrelated keys). Dry-run Stow and Sync write neither. A missing canonical list skips the writes. pi and OpenCode mirrors stay. Init's MCP Progress Log row names pi, OpenCode, Grok, and Codex. No hand-maintained Grok-only or Codex-only list.

**Blocked by:** 04: Grok and Codex snapshot

**Status:** ready-for-agent

- [ ] After init, Grok and Codex MCP views contain the canonical server names
- [ ] Real `dotfiles stow` and `dotfiles sync` refresh Grok and Codex MCP from the canonical list
- [ ] `stow --dry-run` and `sync --dry-run` write no Grok or Codex MCP
- [ ] A missing canonical list skips Grok and Codex MCP writes
- [ ] pi and OpenCode MCP translations still match the canonical list
- [ ] Init MCP Progress Log row names pi, OpenCode, Grok, and Codex
- [ ] Behaviour is observed only through the CLI against a fake Host
