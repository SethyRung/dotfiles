# 03: bash stub chicken-eggs mise then bun

**What to build:** When bun is missing, the bash stub Upstream-Installs mise (mise.run), puts mise on PATH, runs `mise use -g bun@latest`, then execs the TypeScript CLI. When bun is already present, it skips both and execs. Distro mise is not used. This ticket is the Fresh Install chicken-egg; it is not unit-tested (Host remains the only seam).

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Missing bun: stub installs mise from mise.run, then bun via mise, then execs the CLI
- [x] Present bun: stub does not install mise or bun and execs the CLI
- [x] Stub does not use bun.com/install
- [x] No unit tests of the stub (per spec)
