# 04: doctor reports mise; sync does not install tools

**What to build:** doctor reports mise as a required Workflow piece and does not mention nvm. bun, npm, pi, herdr, and OpenCode stay required. `workflowLooksPresent` / continue? is not true without mise. `dotfiles sync` still only pulls, Stows, and refreshes the MCP mirror — it does not call `installMiseTools`. On the real Host, `commandExists` sees Mise Tools in mise install dirs and `~/.local/bin`, not leftover `~/.bun` / nvm / OpenCode bin.

**Blocked by:** 01: `dotfiles init` installs Mise Tools through mise

**Status:** done

- [x] Doctor reports mise missing as a required failure and present as ok
- [x] Doctor does not mention nvm
- [x] Doctor still treats bun, npm, pi, herdr, and OpenCode as required
- [x] A Host missing mise is not treated as Workflow already present
- [x] `dotfiles sync` does not call `installMiseTools`
- [x] Real Host `commandExists` does not treat leftover bun.com / nvm / OpenCode bins as installed
- [x] Behaviour for doctor, continue?, and sync is observed through the CLI against a fake Host
