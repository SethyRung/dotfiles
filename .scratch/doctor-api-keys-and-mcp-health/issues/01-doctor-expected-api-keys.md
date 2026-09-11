# 01: Doctor expected API Key names

**What to build:** `dotfiles doctor` (human and `--json`) reports only the Preset `apiKeys` names as present or missing. Values never appear. Extra env-store names including `PATH` are not listed. An empty expected list omits the API Keys section. A missing expected name exits 1 and makes Workflow Health incomplete. Init continue? still ignores secrets.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Preset `apiKeys` is a name-only list; omitted uses committed defaults; a declared list replaces defaults; empty omits the API Keys section and `--json` `keys` is `[]`
- [x] Present expected names show `[ok]` and `--json` `{ name, ok: true }` in Preset order
- [x] Missing expected names show `[!!]`, doctor exits 1, and `isComplete` is false
- [x] Missing expected names are not extra required-check rows; the required-ok footer is unchanged
- [x] API Key values never appear in stdout, stderr, or `--json`
- [x] `PATH` and other non-expected store names are not listed under API Keys
- [x] Init continue? (`isBootstrapped`) still does not require API Keys
- [x] Invalid Preset JSON still fails doctor before a report
- [x] Doctor help and argv are unchanged
- [x] README doctor copy mentions expected names
- [x] Behaviour is observed only through the CLI against a fake Host
