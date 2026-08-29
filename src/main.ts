import { run } from "@/cli.ts";
import { unixHost } from "@/unix-host.ts";

const result = await run(Bun.argv.slice(2), unixHost);
if (result.stdout) await Bun.write(Bun.stdout, result.stdout);
if (result.stderr) await Bun.write(Bun.stderr, result.stderr);
process.exit(result.exitCode);
