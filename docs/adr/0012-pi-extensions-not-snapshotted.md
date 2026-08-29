# pi extensions are not snapshotted

Bootstrap does not restore `~/.pi/agent/extensions/`. Those files are auto-generated (`herdr-agent-state` by herdr, `moshi-hooks` by moshi-hook). Stowing them crashes pi when the generator binary is missing. Packages still install; herdr/moshi regenerate the files. Amends ADR 0008.
