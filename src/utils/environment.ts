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
