# 08: `dotfiles init` merges API Keys into `/etc/environment`

**What to build:** init prompts for `key=value` CSV. Empty input skips. Non-empty asks for confirmation, then merges those keys into `/etc/environment` with sudo (existing PATH and other lines stay). Values are never logged. Nothing in the repo stores API Keys.

**Blocked by:** 04: `dotfiles init` Distro packages via Package Map

**Status:** ready-for-agent

- [ ] Empty CSV skips the `/etc/environment` write
- [ ] Non-empty CSV prompts for confirmation before writing
- [ ] Declining confirmation does not write
- [ ] Accepting merges keys only; other lines in the file remain
- [ ] CLI output and logs never contain API Key values
- [ ] Behaviour is observed only through the CLI against a fake Host
