export type UpstreamInstall = {
  url: string;
  shell: string;
  env?: Record<string, string>;
  via?: "pipe" | "sh-c";
};

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
} as const satisfies Record<string, UpstreamInstall>;

export function upstreamInstallFor(tool: string): UpstreamInstall | undefined {
  if (tool in upstreamInstalls) {
    return upstreamInstalls[tool as keyof typeof upstreamInstalls];
  }
  return undefined;
}
