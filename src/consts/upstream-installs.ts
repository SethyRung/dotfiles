import type { UpstreamInstall } from "@/types/upstream.ts";

export const upstreamInstalls = {
  bun: {
    url: "https://bun.com/install",
    shell: "bash",
    via: "pipe",
  },
  "oh-my-zsh": {
    url: "https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh",
    shell: "sh",
    via: "sh-c",
    env: { CHSH: "no", RUNZSH: "no" },
  },
  "zsh-autosuggestions": {
    url: "https://github.com/zsh-users/zsh-autosuggestions",
    via: "git-clone",
    dest: ".oh-my-zsh/custom/plugins/zsh-autosuggestions",
  },
  "zsh-syntax-highlighting": {
    url: "https://github.com/zsh-users/zsh-syntax-highlighting",
    via: "git-clone",
    dest: ".oh-my-zsh/custom/plugins/zsh-syntax-highlighting",
  },
  herdr: {
    url: "https://herdr.dev/install.sh",
    shell: "sh",
    via: "pipe",
  },
  pi: {
    url: "https://pi.dev/install.sh",
    shell: "sh",
    via: "pipe",
  },
  opencode: {
    url: "https://opencode.ai/install",
    shell: "bash",
    via: "pipe",
  },
  zed: {
    url: "https://zed.dev/install.sh",
    shell: "sh",
    via: "pipe",
  },
  nvm: {
    url: "https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.7/install.sh",
    shell: "bash",
    via: "pipe",
    then: '. "$HOME/.nvm/nvm.sh" && nvm install --lts',
  },
} as const satisfies Record<string, UpstreamInstall>;

export function upstreamInstallFor(tool: string): UpstreamInstall | undefined {
  if (tool in upstreamInstalls) {
    return upstreamInstalls[tool as keyof typeof upstreamInstalls];
  }
  return undefined;
}
