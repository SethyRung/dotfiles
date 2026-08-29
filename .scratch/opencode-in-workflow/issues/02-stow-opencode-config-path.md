# 02: Stow OpenCode config and put it on PATH

**What to build:** init Stows OpenCode global config, TUI config, and herdr plugin files. OpenCode-local skills, auth, sessions, caches, and `node_modules` are not Stowed. The curated zshrc puts OpenCode's bin directory on PATH so new terminals find `opencode`.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] OpenCode global config and TUI config are Stowed
- [x] herdr OpenCode plugin files are Stowed
- [x] OpenCode-local skills, auth, sessions, and `node_modules` are not Stowed
- [x] Curated zshrc includes OpenCode's bin directory on PATH
- [x] Behaviour is observed only through the CLI against a fake Host
