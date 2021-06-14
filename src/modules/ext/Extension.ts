import { Mixin, registerMixin } from "./Mixin";
import fs from "fs-extra";
import { getActualDataPath } from "../config/DataSupport";
import { loadExtensionDangerously } from "./LoadExtension";
import path from "path";

const EXTENSIONS_ROOT_DIR = "extensions";

export interface Extension {
  id: string; // The unique id of this extension
  name: string; // The display name of this extension
  mixins: Mixin[]; // Mixins
  priority: number; // Small number constructs first
}

export function constructExtension(e: Extension): void {
  for (const m of e.mixins) {
    registerMixin(m.target, m);
    console.log(`Mixin registered: ${e.id} -> ${m.target} (${m.type})`);
  }
}

export async function loadAllExtensions(): Promise<void> {
  try {
    let allExtensions: string[] = [];
    try {
      allExtensions = await fs.readdir(getActualDataPath(EXTENSIONS_ROOT_DIR));
    } catch {}
    const ae: Extension[] = [];
    for (const a of allExtensions) {
      const l = loadExtensionDangerously(
        getActualDataPath(path.join(EXTENSIONS_ROOT_DIR, a))
      );
      if (l !== null) {
        ae.push(l);
      }
    }
    ae.sort((a, b) => {
      return a.priority - b.priority;
    });
    let s = 0;
    for (const x of ae) {
      constructExtension(x);
      s++;
    }
    console.log(`${s} extension(s) loaded.`);
  } catch (e) {
    console.log(e);
  }
}
