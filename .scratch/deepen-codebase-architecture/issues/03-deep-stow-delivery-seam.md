# 03: Deep Stow delivery seam

**What to build:** Stow delivery is encapsulated behind a single deep method on the Host seam. The production Host and fake Host adapters handle scanning the configuration tree, filtering junk and tool-specific files, detecting collisions with existing files, creating timestamped backups, and creating atomic symlinks. Command callers (`stow`, `sync`, `init`) no longer perform granular filesystem checks or manual backup invocations.

**Blocked by:** 01: Zero runtime dependencies & deep Environment seam

**Status:** done

- [x] The Host interface exposes a single Stow delivery method that takes options (such as Ghostty-only or skip-Ghostty filters) and returns a summary report of linked, backed-up, and skipped files.
- [x] Granular file inspection and backup methods (`backup`, `linksIntoRepo`, `isSymlink`, `stow`) are removed from the Host interface, shrinking the seam surface area.
- [x] Running `dotfiles stow` creates timestamped backups of existing non-symlink files, replaces stale or broken symlinks, and skips files already linking into the repository without creating backups.
- [x] Both production and fake Host implementations enforce identical collision and backup rules, eliminating behavioral divergence in tests.
- [x] `dotfiles sync` and `dotfiles init` use the deep Stow method, preserving confirmation behavior when conflicts exist.
- [x] `dotfiles clean` continues to list and clean Stow backup files that match the timestamp pattern.
- [x] Existing Stow, Sync, Clean, and Init test suites pass without regression.
