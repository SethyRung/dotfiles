# pi config is snapshotted; model is not

Bootstrap restores `settings.json` (packages and TUI prefs), `APPEND_SYSTEM.md`, `prompts/`, pi packages, and `extensions/`. It does not restore default model/provider — those stay pi's defaults on a Fresh Install. `auth.json`, sessions, and caches stay off the repo.
