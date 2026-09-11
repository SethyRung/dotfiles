# 04: Grok and Codex snapshot

**What to build:** Bootstrap Stows curated Grok config and curated Codex config plus Codex herdr hooks so a Fresh Install gets those agents' prefs. Auth, sessions, logs, caches, binaries, sqlite, locks, privacy-banner timestamps, local skills, and default model/provider stay off the tree. Skills stay global. gh and agy stay CLIs with no snapshot. An ADR records this cut. Stow junk rules skip Grok and Codex secrets and junk if they appear under `home/`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Init/Stow links curated Grok config into `$HOME`
- [ ] Init/Stow links curated Codex config and herdr hooks into `$HOME`
- [ ] Grok auth, sessions, logs, caches, binaries, sqlite, locks, and privacy-banner timestamps are not Stowed
- [ ] Codex sqlite, tmp, `installation_id`, and local skills are not Stowed
- [ ] Grok and Codex default model/provider are not restored
- [ ] gh and agy have no Stowed config
- [ ] An ADR records Grok/Codex snapshot (config and Codex herdr hooks, not auth/sessions/skills/model)
- [ ] Behaviour is observed only through the CLI against a fake Host
