# 01: `dotfiles init` installs Mise Tools through mise

**What to build:** init Upstream-Installs mise if missing (mise.run), Stows the Workflow mise config (bun/herdr/pi/OpenCode `latest`, Node `lts`, `auto_update` on), then always requests `installMiseTools`. It never requests nvm, bun, herdr, pi, or OpenCode as Upstream Installs. Pi packages still install after Mise Tools when pi was missing beforehand, and are skipped when pi was already present. The Progress Log replaces nvm/herdr/OpenCode Upstream rows with mise, Stow, Mise Tools, and pi packages. Fail-fast if mise or `installMiseTools` fails. Extra live mise tools are not in the committed config.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Init Upstream-Installs mise when it is missing and skips that install when it is present
- [ ] Init Stows the Workflow mise config (five Mise Tools + auto_update) before `installMiseTools`
- [ ] Init always calls `installMiseTools` even if bun/npm/herdr/pi/OpenCode already exist on the fake Host
- [ ] Init never requests nvm, bun, herdr, pi, or OpenCode as Upstream Installs
- [ ] Pi packages are requested only when pi was missing before `installMiseTools`
- [ ] Progress Log no longer has nvm / herdr / OpenCode Upstream steps
- [ ] A failed mise Upstream Install or failed `installMiseTools` fails the command
- [ ] Behaviour is observed only through the CLI against a fake Host
