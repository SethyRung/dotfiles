import type { UpstreamInstall } from "@/types/upstream.ts";

export const upstreamInstalls = {
  mise: {
    url: "https://mise.run",
    shell: "sh",
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
  zed: {
    url: "https://zed.dev/install.sh",
    shell: "sh",
    via: "pipe",
  },
} as const satisfies Record<string, UpstreamInstall>;

export function upstreamInstallFor(tool: string): UpstreamInstall | undefined {
  if (tool in upstreamInstalls) {
    return upstreamInstalls[tool as keyof typeof upstreamInstalls];
  }
  return undefined;
}
