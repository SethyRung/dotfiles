# pi config is snapshotted; model is not

Bootstrap restores `settings.json` (packages and TUI prefs), `APPEND_SYSTEM.md`, `prompts/`, and pi packages. It does not restore default model/provider — those stay pi's defaults on a Fresh Install. `auth.json`, sessions, caches, and auto-generated `extensions/` stay off the repo (ADR 0012).
