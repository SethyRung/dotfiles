# 06: `init --yes` and `clean --yes`

**What to build:** `dotfiles init --yes` runs Bootstrap unattended: continue-yes if Workflow is already present; use `.env` as-is or skip keys if absent; default env store; treat write as confirmed when there are keys; skip Ghostty unless the Preset enables it; overwrite Stow conflicts; no reboot. Unknown Distro still fails before any install. Preset toggles still apply. `dotfiles clean --yes` deletes Stow backups without a confirm prompt, and is still a no-op when there are none. `--yes` is the long flag only, on init and clean only. Help documents it; `--help` wins; `-y` is unknown.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `init --yes` issues no prompts: continue-yes, `.env` as-is or skip keys, default store, write confirmed, Ghostty skipped unless Preset enables it, Stow overwrite, no reboot
- [x] `init --yes` on an unknown Distro still fails before any install
- [x] Preset toggles (Ghostty, Zed, skills, and similar) still apply under `--yes`
- [x] `clean --yes` with backups deletes them without a confirm prompt
- [x] `clean --yes` with no backups remains a no-op
- [x] `-y` on init exits 1 and does no work; `--yes` on stow, sync, or doctor exits 1 and does no work
- [x] `init --yes --help` and `clean --yes --help` print help, exit 0, and do no work
- [x] Init and clean help document `--yes`
- [x] Behaviour is observed only through the CLI against a fake Host
