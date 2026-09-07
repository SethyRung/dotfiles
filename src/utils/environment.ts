export function parseApiKeyCsv(csv: string): Record<string, string> {
  const keys: Record<string, string> = {};
  for (const part of csv.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    keys[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1);
  }
  return keys;
}

export function parseDotenv(content: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const rawLine of content.split("\n")) {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    if (line.startsWith("export ")) {
      line = line.slice(7).trim();
    }
    const eq = line.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
      (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
    ) {
      val = val.slice(1, -1);
    }
    if (key) {
      vars[key] = val;
    }
  }
  return vars;
}

export function resolveStorePath(input: string, home: string): string {
  const trimmed = input.trim();
  if (trimmed === "" || trimmed === "1") {
    return "/etc/environment";
  }
  if (trimmed === "2") {
    return `${home}/.zshenv`;
  }
  if (trimmed === "3") {
    return `${home}/.profile`;
  }
  if (trimmed.startsWith("~/")) {
    return `${home}/${trimmed.slice(2)}`;
  }
  if (trimmed === "~") {
    return home;
  }
  return trimmed;
}

export function formatStorePath(path: string, home: string): string {
  if (path === `${home}/.zshenv`) {
    return "~/.zshenv";
  }
  if (path === `${home}/.profile`) {
    return "~/.profile";
  }
  if (path.startsWith(`${home}/`)) {
    return `~/${path.slice(home.length + 1)}`;
  }
  return path;
}

export function mergeEnvironment(existing: string, keys: Record<string, string>): string {
  const pending = { ...keys };
  const source =
    existing === ""
      ? []
      : existing.endsWith("\n")
        ? existing.slice(0, -1).split("\n")
        : existing.split("\n");
  const out: string[] = [];
  for (const line of source) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const name = trimmed.slice(0, eq);
        if (Object.hasOwn(pending, name)) {
          out.push(`${name}=${pending[name]}`);
          delete pending[name];
          continue;
        }
      }
    }
    out.push(line);
  }
  for (const [name, value] of Object.entries(pending)) {
    out.push(`${name}=${value}`);
  }
  return `${out.join("\n")}\n`;
}
