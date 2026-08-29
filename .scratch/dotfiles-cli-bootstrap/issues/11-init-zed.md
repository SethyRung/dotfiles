# 11: `dotfiles init` installs Zed

**What to build:** After OpenCode exists, init runs the Zed Upstream Install (`https://zed.dev/install.sh`), Stows Zed `settings.json` and `keymap.json`, and declares the current extensions via `auto_install_extensions` in settings.json so Zed installs them itself on first start. Zed is required Workflow like OpenCode: doctor reports it missing as a required failure, and Workflow-presence includes it. Nothing is requested again when Zed already exists (`~/.local/bin/zed` is a Workflow bin dir).

**Blocked by:** 04: `dotfiles init` Distro packages via Package Map

**Status:** done

- [x] Init requests the Zed Upstream Install on the Host
- [x] Zed already installed is not requested again
- [x] Zed settings and keymap are Stowed; extensions are declared via `auto_install_extensions`, not snapshotted
- [x] A failed Zed Upstream Install fails the command
- [x] doctor reports Zed like OpenCode: required, not optional
- [x] Workflow-presence includes Zed
- [x] Behaviour is observed only through the CLI against a fake Host
