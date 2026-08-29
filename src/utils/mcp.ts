import { join } from "node:path";
import type { Host } from "@/types/host.ts";

type XdgMcp = {
  mcpServers?: Record<string, { command?: string; args?: string[] }>;
};

type OpenCodeMcp = Record<string, { type: string; url?: string; command?: string[] }>;

export function openCodeMcpFromXdg(xdgText: string): OpenCodeMcp {
  const xdg = JSON.parse(xdgText) as XdgMcp;
  const mcp: OpenCodeMcp = {};
  for (const [name, spec] of Object.entries(xdg.mcpServers ?? {})) {
    const args = spec.args ?? [];
    const url = args.find((arg) => arg.startsWith("https://") || arg.startsWith("http://"));
    if (url) {
      mcp[name] = { type: "remote", url };
    } else {
      mcp[name] = { type: "local", command: [spec.command, ...args].filter((p) => p != null) };
    }
  }
  return mcp;
}

export async function mirrorOpenCodeMcp(host: Host): Promise<void> {
  const home = host.homeDir();
  const xdgText = await host.readFile(join(home, ".config/mcp/mcp.json"));
  if (xdgText == null) {
    return;
  }
  const ocPath = join(home, ".config/opencode/opencode.json");
  const existingText = await host.readFile(ocPath);
  const existing = existingText ? JSON.parse(existingText) : {};
  existing.mcp = openCodeMcpFromXdg(xdgText);
  await host.writeFile(ocPath, `${JSON.stringify(existing, null, 2)}\n`);
}
