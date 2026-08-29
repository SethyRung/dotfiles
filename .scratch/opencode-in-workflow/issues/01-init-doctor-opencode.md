# 01: `dotfiles init` installs OpenCode; doctor reports it

**What to build:** init requests the OpenCode Upstream Install (always latest). If OpenCode is already present, that install is skipped. A failed OpenCode install fails the command. doctor reports OpenCode as a required Workflow piece: missing is a failure, not a Ghostty-style optional warning.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Init requests the OpenCode Upstream Install on the Host
- [x] If OpenCode is already present, init does not request it again
- [x] A failed OpenCode Upstream Install fails the command
- [x] Doctor reports OpenCode missing as a required failure
- [x] Doctor reports OpenCode present without treating it as optional
- [x] Behaviour is observed only through the CLI against a fake Host
