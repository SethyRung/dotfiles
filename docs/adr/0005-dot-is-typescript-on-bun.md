# `dotfiles` is TypeScript on bun

We chose a TypeScript CLI on bun over bash so the tool is easier to grow than dmmulroy's shell script. A Fresh Install has no bun, so a tiny bash `dotfiles` stub installs bun with `curl -fsSL https://bun.com/install | bash` if missing, then execs the TypeScript CLI.
