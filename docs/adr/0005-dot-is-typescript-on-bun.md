# `dotfiles` is TypeScript on bun

We chose a TypeScript CLI on bun over bash so the tool is easier to grow than dmmulroy's shell script. A Fresh Install has no bun, so a tiny bash `dotfiles` stub Upstream-Installs mise (`mise.run`) if bun is missing, then `mise use -g bun@latest`, then execs the TypeScript CLI. bun.com/install was rejected once bun became a Mise Tool (ADR 0016).
