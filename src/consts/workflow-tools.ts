import { upstreamInstalls } from "@/consts/upstream-installs.ts";

type UpstreamKey = keyof typeof upstreamInstalls;

export const workflowTools = {
  zsh: { command: "zsh", label: "zsh" },
  git: { command: "git", label: "git" },
  stow: { command: "stow", label: "stow" },
  npm: {
    command: "npm",
    label: "npm",
    // npm on PATH is the presence proxy for the nvm Upstream Install
    upstream: "nvm",
  },
  bun: { command: "bun", label: "bun", upstream: "bun" },
  pi: { command: "pi", label: "pi", upstream: "pi" },
  herdr: { command: "herdr", label: "herdr", upstream: "herdr" },
  opencode: { command: "opencode", label: "OpenCode", upstream: "opencode" },
  zed: { command: "zed", label: "Zed", upstream: "zed" },
  ghostty: { command: "ghostty", label: "Ghostty" },
} as const satisfies Record<string, { command: string; label: string; upstream?: UpstreamKey }>;

export type WorkflowToolKey = keyof typeof workflowTools;
export type WorkflowTool = (typeof workflowTools)[WorkflowToolKey];

export const requiredWorkflowTools: readonly WorkflowTool[] = [
  workflowTools.zsh,
  workflowTools.git,
  workflowTools.stow,
  workflowTools.npm,
  workflowTools.bun,
  workflowTools.pi,
  workflowTools.herdr,
  workflowTools.opencode,
  workflowTools.zed,
];
