import { join } from "node:path";
import type { Host } from "@/types/host.ts";

export const MCP_SOURCE = "src/consts/mcp.json";

const PI_MCP_DEST = ".pi/agent/mcp.json";
const OPENCODE_CONFIG_DEST = ".config/opencode/opencode.json";
const GROK_CONFIG_DEST = ".grok/config.toml";
const CODEX_CONFIG_DEST = ".codex/config.toml";

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
  const path = join(host.homeDir(), PI_MCP_DEST);
  const existingText = await host.readFile(path);
  if (existingText == null) {
    return;
  }
  const existing = JSON.parse(existingText);
  existing.mcpServers = piMcpFromCanonical(servers);
  await host.writeFile(path, `${JSON.stringify(existing, null, 2)}\n`);
}

async function writeOpenCodeMcp(host: Host, servers: CanonicalMcp): Promise<void> {
  const path = join(host.homeDir(), OPENCODE_CONFIG_DEST);
  const existingText = await host.readFile(path);
  if (existingText == null) {
    return;
  }
  const existing = JSON.parse(existingText);
  existing.mcp = openCodeMcpFromCanonical(servers);
  await host.writeFile(path, `${JSON.stringify(existing, null, 2)}\n`);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function tomlKey(key: string): string {
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : JSON.stringify(key);
}

function tomlScalar(value: unknown): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  throw new Error("unsupported TOML value");
}

function stringifyToml(obj: Record<string, unknown>, path: string[] = []): string {
  const lines: string[] = [];
  const scalars: [string, unknown][] = [];
  const nested: [string, Record<string, unknown>][] = [];
  const arrayTables: [string, Record<string, unknown>[]][] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value) && value.length > 0 && value.every(isPlainObject)) {
      arrayTables.push([key, value]);
    } else if (isPlainObject(value)) {
      nested.push([key, value]);
    } else {
      scalars.push([key, value]);
    }
  }

  if (path.length > 0 && scalars.length > 0) {
    lines.push(`[${path.map(tomlKey).join(".")}]`);
  }
  for (const [key, value] of scalars) {
    if (Array.isArray(value)) {
      lines.push(`${tomlKey(key)} = [${value.map(tomlScalar).join(", ")}]`);
    } else {
      lines.push(`${tomlKey(key)} = ${tomlScalar(value)}`);
    }
  }
  for (const [key, value] of nested) {
    const chunk = stringifyToml(value, [...path, key]);
    if (chunk !== "") {
      if (lines.length > 0) {
        lines.push("");
      }
      lines.push(chunk);
    }
  }
  for (const [key, rows] of arrayTables) {
    for (const row of rows) {
      if (lines.length > 0) {
        lines.push("");
      }
      lines.push(`[[${[...path, key].map(tomlKey).join(".")}]]`);
      for (const [rowKey, rowValue] of Object.entries(row)) {
        lines.push(`${tomlKey(rowKey)} = ${tomlScalar(rowValue)}`);
      }
    }
  }
  return lines.join("\n");
}

async function writeTomlMcp(host: Host, rel: string, servers: CanonicalMcp): Promise<void> {
  const path = join(host.homeDir(), rel);
  const existingText = await host.readFile(path);
  if (existingText == null) {
    return;
  }
  const existing = Bun.TOML.parse(existingText) as Record<string, unknown>;
  existing.mcp_servers = piMcpFromCanonical(servers);
  await host.writeFile(path, `${stringifyToml(existing)}\n`);
}

export async function mirrorMcp(host: Host): Promise<void> {
  const servers = await loadCanonical(host);
  if (servers == null) {
    return;
  }
  await writePiMcp(host, servers);
  await writeOpenCodeMcp(host, servers);
  await writeTomlMcp(host, GROK_CONFIG_DEST, servers);
  await writeTomlMcp(host, CODEX_CONFIG_DEST, servers);
}
