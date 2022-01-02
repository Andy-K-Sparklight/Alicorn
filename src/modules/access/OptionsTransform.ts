import { outputFile, readFile } from "fs-extra";
import { MinecraftContainer } from "../container/MinecraftContainer";

const OPTIONS_FILE = "options.txt";

export async function parseOptions(
  c: MinecraftContainer
): Promise<Map<string, string>> {
  const f = c.resolvePath(OPTIONS_FILE);
  const d = (await readFile(f)).toString().split("\n");
  const out = new Map<string, string>();
  d.forEach((v) => {
    v = v.trim();
    if (v.length === 0 || !v.includes(":")) {
      return;
    }
    const [k, ...p] = v.split(":");
    const cv = p.join(":");
    out.set(k, cv);
  });
  return out;
}

// Warning: this will override!
export async function buildOptions(
  origin: Map<string, string>,
  container: MinecraftContainer
): Promise<void> {
  const f = container.resolvePath(OPTIONS_FILE);
  const o = [];
  for (const [k, v] of origin.entries()) {
    if (k.length > 0) {
      const c = k + ":" + v; // Value may be empty
      o.push(c);
    }
  }
  await outputFile(f, o.join("\n"));
}
