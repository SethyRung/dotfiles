# 01: `dotfiles` CLI with fake Host and bun stub

**What to build:** `dotfiles` runs as the user-facing command. On a Fresh Install with no bun, the bash stub installs bun via the official Upstream Install, then execs the TypeScript CLI. If bun is already present, the stub skips that install. Help lists `init`, `doctor`, and `stow`. Tests drive the CLI through a fake Host.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] `dotfiles` (not `dot`) is the command that prints help for `init`, `doctor`, and `stow`
- [x] With bun missing, the stub requests the bun Upstream Install on the Host, then the CLI runs
- [x] With bun present, the stub does not request bun again
- [x] Tests inject a fake Host; no real network or package manager is required
