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

eval "$($HOME/.local/bin/mise activate zsh)"

export PATH="$HOME/.local/bin:$HOME/.cache/.bun/bin:$PATH"
