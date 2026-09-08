import { join } from "node:path";
import type { Host } from "@/types/host.ts";

export const MCP_SOURCE = "src/consts/mcp.json";

type CanonicalServer = {
  url?: string;
  command?: string;
  args?: string[];
};

type CanonicalMcp = Record<string, CanonicalServer>;

type OpenCodeMcp = Record<string, { type: string; url?: string; command?: string[] }>;

type PiMcpServers = Record<string, { url?: string; command?: string; args?: string[] }>;

export function openCodeMcpFromCanonical(servers: CanonicalMcp): OpenCodeMcp {
  const mcp: OpenCodeMcp = {};
  for (const [name, spec] of Object.entries(servers)) {
    if (spec.url) {
      mcp[name] = { type: "remote", url: spec.url };
    } else {
      mcp[name] = {
        type: "local",
        command: [spec.command, ...(spec.args ?? [])].filter((p) => p != null),
      };
    }
  }
  return mcp;
}

export function piMcpFromCanonical(servers: CanonicalMcp): PiMcpServers {
  const mcp: PiMcpServers = {};
  for (const [name, spec] of Object.entries(servers)) {
    if (spec.url) {
      mcp[name] = { url: spec.url };
    } else {
      mcp[name] = { command: spec.command, args: spec.args ?? [] };
    }
  }
  return mcp;
}

async function loadCanonical(host: Host): Promise<CanonicalMcp | null> {
  const text = await host.readFile(join(host.repoDir(), MCP_SOURCE));
  if (text == null) {
    return null;
  }
  const parsed = JSON.parse(text) as CanonicalMcp & { $schema?: unknown };
  delete parsed.$schema;
  return parsed;
}

async function writePiMcp(host: Host, servers: CanonicalMcp): Promise<void> {
  const path = join(host.homeDir(), ".pi/agent/mcp.json");
  const existingText = await host.readFile(path);
  const existing = existingText ? JSON.parse(existingText) : {};
  existing.mcpServers = piMcpFromCanonical(servers);
  await host.writeFile(path, `${JSON.stringify(existing, null, 2)}\n`);
}

async function writeOpenCodeMcp(host: Host, servers: CanonicalMcp): Promise<void> {
  const path = join(host.homeDir(), ".config/opencode/opencode.json");
  const existingText = await host.readFile(path);
  if (existingText == null) {
    return;
  }
  const existing = JSON.parse(existingText);
  existing.mcp = openCodeMcpFromCanonical(servers);
  await host.writeFile(path, `${JSON.stringify(existing, null, 2)}\n`);
}

export async function mirrorMcp(host: Host): Promise<void> {
  const servers = await loadCanonical(host);
  if (servers == null) {
    return;
  }
  await writePiMcp(host, servers);
  await writeOpenCodeMcp(host, servers);
}
