# 01: Doctor expected API Key names

**What to build:** `dotfiles doctor` (human and `--json`) reports only the Preset `apiKeys` names as present or missing. Values never appear. Extra env-store names including `PATH` are not listed. An empty expected list omits the API Keys section. A missing expected name exits 1 and makes Workflow Health incomplete. Init continue? still ignores secrets.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Preset `apiKeys` is a name-only list; omitted uses committed defaults; a declared list replaces defaults; empty omits the API Keys section and `--json` `keys` is `[]`
- [ ] Present expected names show `[ok]` and `--json` `{ name, ok: true }` in Preset order
- [ ] Missing expected names show `[!!]`, doctor exits 1, and `isComplete` is false
- [ ] Missing expected names are not extra required-check rows; the required-ok footer is unchanged
- [ ] API Key values never appear in stdout, stderr, or `--json`
- [ ] `PATH` and other non-expected store names are not listed under API Keys
- [ ] Init continue? (`isBootstrapped`) still does not require API Keys
- [ ] Invalid Preset JSON still fails doctor before a report
- [ ] Doctor help and argv are unchanged
- [ ] README doctor copy mentions expected names
- [ ] Behaviour is observed only through the CLI against a fake Host
