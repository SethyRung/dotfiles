export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="bira"

plugins=(
  git
  docker
  docker-compose
  npm
  nvm
  node
  jsontools
  sudo
  extract
  history
  colored-man-pages
  command-not-found
  zsh-autosuggestions
  zsh-syntax-highlighting
)

source "$ZSH/oh-my-zsh.sh"

export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
export PATH="${HERDR_INSTALL_DIR:-$HOME/.local/bin}:$PATH"
export PATH="$HOME/.opencode/bin:$PATH"

# Cache SSH key passphrases in systemd's ssh-agent for the whole login.
export SSH_AUTH_SOCK="${XDG_RUNTIME_DIR}/ssh-agent.socket"
