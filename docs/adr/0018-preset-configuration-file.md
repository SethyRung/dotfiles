# Preset Configuration File

Bootstrap and doctor defaults for skills, pi packages, Oh My Zsh plugins, and distro packages can be overridden via an optional `dotfiles.json` preset file in the repository root.

Declared lists completely replace the built-in defaults for that specific category, while omitted keys continue using built-in defaults. Supported fields include `skills` (list of `owner/repo@skill` specs), `piPackages` / `pi_packages` (pi extensions), `omzPlugins` / `omz_plugins` (zsh plugins), and `packages` / `distroPackages` (either a distro-agnostic list or a map keyed by package manager). Invalid JSON syntax or a non-object root fails closed.
