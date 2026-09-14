import type { PackageManager } from "@/types/host.ts";

const packageManagers: readonly PackageManager[] = ["apt", "pacman", "dnf", "zypper"];

const rootKeys = [
  "$schema",
  "tools",
  "skills",
  "piPackages",
  "pi_packages",
  "omzPlugins",
  "omz_plugins",
  "packages",
  "distroPackages",
  "distro_packages",
  "apiKeys",
  "mcp",
] as const;

const toolKeys = [
  "ghostty",
  "zed",
  "skills",
  "piPackages",
  "pi_packages",
  "omzPlugins",
  "omz_plugins",
] as const;

const listKeys = [
  "skills",
  "piPackages",
  "pi_packages",
  "omzPlugins",
  "omz_plugins",
  "apiKeys",
] as const;

const packagesKeys = ["packages", "distroPackages", "distro_packages"] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateTools(tools: unknown, problems: string[]): void {
  if (!isPlainObject(tools)) {
    problems.push('"tools" must be an object');
    return;
  }
  for (const [key, value] of Object.entries(tools)) {
    if (!(toolKeys as readonly string[]).includes(key)) {
      problems.push(`unknown key "tools.${key}"`);
    } else if (typeof value !== "boolean") {
      problems.push(`"tools.${key}" must be a boolean`);
    }
  }
}

function validatePackages(key: string, packages: unknown, problems: string[]): void {
  if (isStringArray(packages)) {
    return;
  }
  if (!isPlainObject(packages)) {
    problems.push(`"${key}" must be an array of strings or a package-manager map`);
    return;
  }
  for (const [pm, list] of Object.entries(packages)) {
    if (!(packageManagers as readonly string[]).includes(pm)) {
      problems.push(`unknown package manager "${key}.${pm}"`);
    } else if (!isStringArray(list)) {
      problems.push(`"${key}.${pm}" must be an array of strings`);
    }
  }
}

function validateMcpServer(name: string, server: unknown, problems: string[]): void {
  if (!isPlainObject(server)) {
    problems.push(`"mcp.${name}" must be an object`);
    return;
  }
  const hasUrl = typeof server.url === "string";
  const hasCommand = typeof server.command === "string" && server.command.length > 0;
  if (hasUrl && hasCommand) {
    problems.push(`"mcp.${name}" must set either "url" or "command", not both`);
  } else if (!hasUrl && !hasCommand) {
    problems.push(`"mcp.${name}" must set a string "url" or a non-empty string "command"`);
  }
  const allowed = hasUrl ? ["url"] : ["command", "args"];
  for (const extra of Object.keys(server)) {
    if (!allowed.includes(extra)) {
      problems.push(`unknown key "mcp.${name}.${extra}"`);
    }
  }
  if (server.args !== undefined && !isStringArray(server.args)) {
    problems.push(`"mcp.${name}.args" must be an array of strings`);
  }
}

export function validatePresetInput(value: unknown): string[] {
  if (!isPlainObject(value)) {
    return ["root must be an object"];
  }
  const problems: string[] = [];
  for (const key of Object.keys(value)) {
    if (!(rootKeys as readonly string[]).includes(key)) {
      problems.push(`unknown key "${key}"`);
    }
  }
  if (value.tools !== undefined) {
    validateTools(value.tools, problems);
  }
  for (const key of listKeys) {
    if (value[key] !== undefined && !isStringArray(value[key])) {
      problems.push(`"${key}" must be an array of strings`);
    }
  }
  for (const key of packagesKeys) {
    if (value[key] !== undefined) {
      validatePackages(key, value[key], problems);
    }
  }
  if (value.mcp !== undefined) {
    if (!isPlainObject(value.mcp)) {
      problems.push('"mcp" must be an object');
    } else {
      for (const [name, server] of Object.entries(value.mcp)) {
        validateMcpServer(name, server, problems);
      }
    }
  }
  return problems;
}
