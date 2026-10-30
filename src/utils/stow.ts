import type { StowReport } from "@/types/result.ts";

// These files hold curated settings plus machine state. Stow leaves an existing file in place; the MCP mirror overlays the repo copy onto it.
const liveAgentConfigs = new Set([
  ".pi/agent/settings.json",
  ".codex/config.toml",
  ".grok/config.toml",
  ".config/opencode/opencode.json",
  ".config/Cursor/User/settings.json",
  ".gemini/antigravity-cli/settings.json",
  ".gemini/config/config.json",
]);

export function keepsLiveAgentConfig(rel: string): boolean {
  return liveAgentConfigs.has(rel);
}

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
    rel.startsWith(".gemini/antigravity-cli/conversations/") ||
    rel === ".gemini/antigravity-cli/history.jsonl" ||
    rel.startsWith(".gemini/antigravity-cli/crashes/") ||
    rel.startsWith(".gemini/antigravity-cli/implicit/") ||
    rel.startsWith(".gemini/antigravity-cli/knowledge/") ||
    rel.startsWith(".gemini/antigravity-cli/presence/") ||
    rel.startsWith(".cursor/projects/") ||
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
