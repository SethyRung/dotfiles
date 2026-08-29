# OpenCode snapshot is config plus herdr plugins, not local skills

Bootstrap Stows OpenCode `opencode.json`, TUI config, and herdr plugin files. It does not snapshot `~/.config/opencode/skills/` — Skills stay global via skills.sh (ADR 0007), and that tree is Android-heavy, which v1 excludes. auth, sessions, caches, and `node_modules` stay off the repo, same as pi.
