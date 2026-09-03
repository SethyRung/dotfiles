import { join } from "node:path";

export async function readZshrc(): Promise<string> {
  return await Bun.file(join(import.meta.dir, "../../home/.zshrc")).text();
}
