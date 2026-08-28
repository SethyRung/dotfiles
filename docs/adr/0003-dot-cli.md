# User-facing tool is a CLI, not `./install`

Bootstrap is invoked as a CLI (`init`, `doctor`, `stow`), not `./install`. We want dmmulroy-style commands even though a single script would ship faster. The extra surface is accepted so the Fresh Install path and later maintenance share one tool. The command name is `dotfiles` (see ADR 0009).
