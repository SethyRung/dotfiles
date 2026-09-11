# Grok and Codex snapshot is config plus Codex herdr hooks

Bootstrap Stows curated Grok `config.toml` (marketplace, installer, UI prefs) and Codex `config.toml`, `hooks.json`, and herdr hook script. It does not snapshot auth, sessions, logs, caches, binaries, sqlite, locks, privacy-banner timestamps, local skills, or default model/provider — same spirit as pi (ADR 0008) and OpenCode (ADR 0011). Skills stay global via skills.sh (ADR 0007). gh and agy stay Mise Tool CLIs with no snapshot (ADR 0020). MCP translators for Grok and Codex stay a later cut.
