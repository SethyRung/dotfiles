import { join } from "node:path";
import type { Host } from "@/types/host.ts";

const systemPromptAdapters = {
  pi: ".pi/agent/APPEND_SYSTEM.md",
  codex: ".codex/AGENTS.md",
} as const;

export async function mirrorSystemPrompt(host: Host, stowedPaths: string[]): Promise<void> {
  const prompt = await host.readFile(join(host.repoDir(), "src/consts/system-prompt.md"));
  if (prompt === null) {
    return;
  }
  for (const destination of Object.values(systemPromptAdapters)) {
    const path = join(host.homeDir(), destination);
    if (!stowedPaths.includes(path)) {
      continue;
    }
    const existing = await host.readFile(path);
    if (existing !== null && existing !== prompt) {
      await host.writeFile(path, prompt);
    }
  }
}
