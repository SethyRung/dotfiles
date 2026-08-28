import { run } from "./cli.ts";
import { unixHost } from "./unix-host.ts";

const result = await run(Bun.argv.slice(2), unixHost);
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.exitCode);
