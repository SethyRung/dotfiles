# Store location selection is the API Key write

ADR 0017 made the destination selectable. Init then asked again: `Write API Keys to <path>? [y/N]`. That second prompt is redundant — choosing the store location is the decision to merge keys there.

Selecting a location (including the default `/etc/environment`) writes. Empty CSV or an empty `.env` still skips. `--yes` still uses the default store without a menu. Stow conflict prompts are unchanged.

Extends ADR 0017 (later number wins).
