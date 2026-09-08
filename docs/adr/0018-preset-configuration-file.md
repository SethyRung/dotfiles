# Preset Configuration File and Upfront Questions

Bootstrap and doctor defaults for tools, skills, pi packages, Oh My Zsh plugins, and distro packages are configured via `dotfiles.json` in the repository root.

All interactive questions (workflow continuation, environment/API keys, and unconfigured optional tools such as Ghostty) are collected upfront before the progress session begins, enabling an uninterrupted one-shot installation process.

The `tools` map supports boolean toggles for `ghostty`, `zed`, `skills`, `piPackages`, and `omzPlugins`. Explicitly enabled or disabled tools skip interactive prompts. Declared lists (`skills`, `piPackages`, `omzPlugins`, `packages`) completely replace defaults for that category. Invalid JSON syntax or a non-object root fails closed.
