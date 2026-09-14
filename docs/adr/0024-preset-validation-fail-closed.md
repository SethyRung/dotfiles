# Preset validation is fail-closed

ADR 0018 made invalid JSON syntax and a non-object root fail Bootstrap. It left unknown keys and wrong types to be silently ignored or coerced to defaults, so a typo such as `"zed": "false"` or `skillz` changed nothing and reported no error, and the committed `schema/dotfiles.schema.json` was never enforced at runtime.

`dotfiles.json` is the single source of truth for tools, skills, pi packages, OMZ plugins, packages, MCP, and API Key names. A Preset that does not match the schema now fails closed with a message naming every offending key, in both `init` and `doctor`. The documented aliases (`pi_packages`, `omz_plugins`, `distroPackages`, `distro_packages`) stay accepted for compatibility.

Extends ADR 0018 (later number wins).
