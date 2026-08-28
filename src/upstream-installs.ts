export type UpstreamInstall = {
  url: string;
  shell: string;
  env?: Record<string, string>;
};

export const upstreamInstalls = {
  bun: {
    url: "https://bun.com/install",
    shell: "bash",
  },
  "oh-my-zsh": {
    url: "https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh",
    shell: "sh",
    env: { CHSH: "no", RUNZSH: "no" },
  },
} as const satisfies Record<string, UpstreamInstall>;

export function upstreamInstallFor(tool: string): UpstreamInstall | undefined {
  if (tool in upstreamInstalls) {
    return upstreamInstalls[tool as keyof typeof upstreamInstalls];
  }
  return undefined;
}
