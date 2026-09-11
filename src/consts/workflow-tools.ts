import { upstreamInstalls } from "@/consts/upstream-installs.ts";

type UpstreamKey = keyof typeof upstreamInstalls;

export const workflowTools = {
  zsh: { command: "zsh", label: "zsh" },
  git: { command: "git", label: "git" },
  stow: { command: "stow", label: "stow" },
  mise: { command: "mise", label: "mise", upstream: "mise" },
  npm: { command: "npm", label: "npm" },
  bun: { command: "bun", label: "bun" },
  pi: { command: "pi", label: "pi" },
  herdr: { command: "herdr", label: "herdr" },
  opencode: { command: "opencode", label: "OpenCode" },
  grok: { command: "grok", label: "Grok" },
  codex: { command: "codex", label: "Codex" },
  gh: { command: "gh", label: "gh" },
  agy: { command: "agy", label: "agy" },
  zed: { command: "zed", label: "Zed", upstream: "zed" },
  ghostty: { command: "ghostty", label: "Ghostty" },
} as const satisfies Record<string, { command: string; label: string; upstream?: UpstreamKey }>;

export type WorkflowToolKey = keyof typeof workflowTools;
export type WorkflowTool = (typeof workflowTools)[WorkflowToolKey];

export const requiredWorkflowTools: readonly WorkflowTool[] = [
  workflowTools.zsh,
  workflowTools.git,
  workflowTools.stow,
  workflowTools.mise,
  workflowTools.npm,
  workflowTools.bun,
  workflowTools.pi,
  workflowTools.herdr,
  workflowTools.opencode,
  workflowTools.grok,
  workflowTools.codex,
  workflowTools.gh,
  workflowTools.agy,
  workflowTools.zed,
];

export const requiredWorkflowCommands: readonly string[] = requiredWorkflowTools.map(
  (tool) => tool.command,
);

export const miseToolsProgressDetail = "agy, bun, codex, gh, grok, herdr, node, opencode, pi";
