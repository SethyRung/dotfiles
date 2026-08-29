export function isYes(answer: string): boolean {
  return ["y", "yes"].includes(answer.trim().toLowerCase());
}

export function isZsh(shell: string | null): boolean {
  return shell === "zsh" || (shell?.endsWith("/zsh") ?? false);
}
