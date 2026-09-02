export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="bira"

plugins=(
  git
  docker
  docker-compose
  npm
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

export PATH="$HOME/.local/bin:$PATH"

eval "$($HOME/.local/bin/mise activate zsh)"

# Cache SSH key passphrases in systemd's ssh-agent for the whole login.
export SSH_AUTH_SOCK="${XDG_RUNTIME_DIR}/ssh-agent.socket"
