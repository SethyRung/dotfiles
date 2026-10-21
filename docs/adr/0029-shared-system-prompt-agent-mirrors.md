# Shared system prompt with agent adapters

The Workflow system prompt lives in `src/consts/system-prompt.md`. Bootstrap, Stow, and Sync mirror that Markdown through the Host into pi's `~/.pi/agent/APPEND_SYSTEM.md` and Codex's `~/.codex/AGENTS.md`. Both agents accept Markdown, so their adapters select the native destination and preserve the shared text. A new agent adds an adapter.

The files under `home/` are templates. Stow delivers them first, preserving its normal backup and conflict behavior; the adapters then replace existing destinations with the shared prompt. Mirroring runs in the shared Stow helper and only considers paths Stow delivered or recognized as repo links, so declining conflicts preserves existing instructions. Missing source or destination files are skipped, matching the MCP mirror flow. Dry runs never write prompts. Agent destinations are generated output; edit only the shared source.

The shared text uses agent-neutral wording. Pi appends it to its built-in system prompt. Codex loads it as global instructions, alongside project guidance, using its [documented AGENTS.md discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md). Codex's built-in system instructions remain in place; a global `AGENTS.override.md` takes precedence over this mirror.

Extends ADR 0008 (pi prompt source) and ADR 0021 (Codex snapshot).
