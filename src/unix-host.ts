import type { Host } from "./host.ts";

export const unixHost: Host = {
  commandExists(command) {
    return Bun.which(command) !== null;
  },
  async runUpstreamInstall(tool) {
    if (tool !== "bun") {
      throw new Error(`unknown Upstream Install: ${tool}`);
    }
    const proc = Bun.spawn(["bash", "-c", "curl -fsSL https://bun.com/install | bash"], {
      stdout: "inherit",
      stderr: "inherit",
    });
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      throw new Error("bun Upstream Install failed");
    }
  },
};
