import { join } from "node:path";
import type { Host } from "@/types/host.ts";

const cursorPlugin = ".cursor/plugins/local/dotfiles-system-prompt";
const renderCursorRule = (prompt: string) => `---\nalwaysApply: true\n---\n\n${prompt}`;

const systemPromptAdapters = [
  { path: ".pi/agent/APPEND_SYSTEM.md", render: (prompt: string) => prompt },
  { path: ".codex/AGENTS.md", render: (prompt: string) => prompt },
  {
    path: `${cursorPlugin}/rules/system-prompt.mdc`,
    render: renderCursorRule,
  },
  {
    path: `${cursorPlugin}/.cursor-plugin/plugin.json`,
    render: () =>
      `${JSON.stringify({ name: "dotfiles-system-prompt", description: "Shared Workflow instructions" }, null, 2)}\n`,
  },
] as const;

export async function mirrorSystemPrompt(host: Host): Promise<void> {
  const prompt = await host.readFile(join(host.repoDir(), "src/consts/system-prompt.md"));
  if (prompt === null) {
    return;
  }
  for (const adapter of systemPromptAdapters) {
    const path = join(host.homeDir(), adapter.path);
    const rendered = adapter.render(prompt);
    const existing = await host.readFile(path);
    if (existing !== rendered) {
      await host.writeFile(path, rendered);
    }
  }
  const legacyCursorRule = join(host.homeDir(), ".cursor/rules/system-prompt.mdc");
  if ((await host.readFile(legacyCursorRule)) === renderCursorRule(prompt)) {
    host.removeFile(legacyCursorRule);
  }
}
