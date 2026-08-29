export function isStowJunk(rel: string): boolean {
  const parts = rel.split("/");
  const base = parts.at(-1) ?? rel;
  return (
    parts.includes("logs") ||
    parts.includes("sockets") ||
    parts.includes("sessions") ||
    parts.includes("node_modules") ||
    parts.includes("cache") ||
    rel.startsWith(".config/opencode/skills/") ||
    rel.startsWith(".pi/agent/extensions/") ||
    rel.endsWith(".log") ||
    rel.endsWith(".sock") ||
    rel.endsWith(".db") ||
    rel.endsWith(".db-shm") ||
    rel.endsWith(".db-wal") ||
    base === "auth.json" ||
    base.includes("cache") ||
    base.startsWith("models")
  );
}

export function isGhosttyConfig(rel: string): boolean {
  return rel.startsWith(".config/ghostty/");
}
