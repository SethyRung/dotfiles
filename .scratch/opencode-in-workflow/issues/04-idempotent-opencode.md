# 04: idempotent Workflow includes OpenCode

**What to build:** Workflow already looks present only if OpenCode is present too. Continue skips OpenCode when it is already installed. Continue still confirms before Stow conflicts, including OpenCode config.

**Blocked by:** 01: `dotfiles init` installs OpenCode; doctor reports it

**Status:** done

- [x] A Host missing OpenCode is not treated as Workflow already present
- [x] Continue does not re-request OpenCode if it is already installed
- [x] Continue still confirms before Stow conflicts for OpenCode config
- [x] Behaviour is observed only through the CLI against a fake Host
