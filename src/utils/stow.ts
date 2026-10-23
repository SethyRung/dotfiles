import type { StowReport } from "@/types/result.ts";

// herdr/orca write these into $HOME themselves and overwrite them on reinstall (ADR 0033).
const generatedAgentFiles = new Set([
  ".codex/herdr-agent-state.sh",
  ".codex/hooks.json",
  ".config/opencode/herdr-tui-session.js",
  ".config/opencode/plugins/herdr-agent-state.js",
  ".config/opencode/tui.json",
  ".config/opencode/tui.jsonc",
]);

export function isGeneratedAgentFile(rel: string): boolean {
  return generatedAgentFiles.has(rel);
}

export function isStowJunk(rel: string): boolean {
  const parts = rel.split("/");
  const base = parts.at(-1) ?? rel;
  return (
    isGeneratedAgentFile(rel) ||
    parts.includes("logs") ||
    parts.includes("sockets") ||
    parts.includes("sessions") ||
    parts.includes("node_modules") ||
    parts.includes("cache") ||
    rel.startsWith(".config/opencode/skills/") ||
    rel.startsWith(".pi/agent/extensions/") ||
    rel.startsWith(".grok/bin/") ||
    rel.startsWith(".codex/skills/") ||
    rel.startsWith(".codex/tmp/") ||
    rel.startsWith(".codex/.tmp/") ||
    rel.endsWith(".log") ||
    rel.endsWith(".sock") ||
    rel.endsWith(".db") ||
    rel.endsWith(".db-shm") ||
    rel.endsWith(".db-wal") ||
    rel.endsWith(".sqlite") ||
    rel.endsWith(".sqlite-shm") ||
    rel.endsWith(".sqlite-wal") ||
    rel.endsWith(".lock") ||
    base === "auth.json" ||
    base === "installation_id" ||
    base === "agent_id" ||
    base === "trusted_folders.toml" ||
    base.includes("cache") ||
    base.startsWith("models")
  );
}

export function isGhosttyConfig(rel: string): boolean {
  return rel.startsWith(".config/ghostty/");
}

export function formatStowReport(report: StowReport): string {
  const lines: string[] = ["Stow:"];
  if (report.linked.length > 0) {
    lines.push("  linked:", ...report.linked.map((p) => `    ${p}`));
  }
  if (report.backedUp.length > 0) {
    lines.push("  backed up:", ...report.backedUp.map((p) => `    ${p}`));
  }
  if (report.skipped.length > 0) {
    lines.push("  skipped:", ...report.skipped.map((p) => `    ${p}`));
  }
  if (report.linked.length === 0 && report.backedUp.length === 0 && report.skipped.length === 0) {
    lines.push("  (empty)");
  }
  return lines.join("\n") + "\n";
}
