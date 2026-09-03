# 06: Extract `init` command and finalize dispatcher

**What to build:** Isolate the bootstrap `dotfiles init` workflow and its private re-run detection into its own command module and dedicated test suite. The CLI dispatcher becomes a pure router mapping arguments to command functions and handling help/unknown command errors. All init tests move to a dedicated test file, leaving the top-level CLI test file covering only help and unknown command routing.

**Blocked by:** 04: Extract shared `stow` engine and command

**Status:** done

- [x] Bootstrap workflow logic and re-run detection helper reside in their own command module under `src/commands/`
- [x] Dispatcher in `src/cli.ts` acts strictly as a router from CLI arguments to command functions
- [x] Init tests are moved to a dedicated test file under `tests/commands/` and invoke behavior exclusively via `run(["init"], host)`
- [x] Top-level CLI test file covers only `--help`, empty arguments, and unknown command handling
- [x] Full bootstrap sequence, progress tracking, Upstream Installs, and prompt interactions remain unchanged
- [x] `bun test` passes
