import { readdir } from "fs-extra";
import StreamZip from "node-stream-zip";
import toml from "toml";
import yauzl, { Entry, ZipFile } from "yauzl";
import { safeGet } from "../commons/Null";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { escapeQuote, ModLoader } from "./ModInfo";

export interface ModDepUnit {
  name: string; // MyName
  depends: string[];
  origin: string; // File
  loader: ModLoader;
}

interface ShortModDepUnit {
  name: string;
  depends: string[];
}
export interface UnmetDepUnit {
  name: string;
  missing: string;
  origin: string;
}

export async function configureModDepChain(
  container: MinecraftContainer,
  loader: ModLoader
): Promise<UnmetDepUnit[]> {
  // Return missing dep info
  const all = await readdir(container.getModsRoot());
  const collection: ModDepUnit[] = [];
  await Promise.allSettled(
    all.map(async (mf) => {
      const cur = container.getModJar(mf);
      const t = await getModType(cur);
      if (t === loader) {
        switch (loader) {
          case ModLoader.FABRIC:
            collection.push(
              ...(await unfoldFabricJar(cur)).map((c) => {
                return { ...c, origin: cur, loader: ModLoader.FABRIC };
              })
            );
            break;
          case ModLoader.FORGE:
            collection.push(
              ...(await unfoldForgeTomlJar(cur)).map((c) => {
                return { ...c, origin: cur, loader: ModLoader.FABRIC };
              })
            );
        }
      }
    })
  );
  const o: UnmetDepUnit[] = [];
  const allProvided: Set<string> = new Set(
    loader === ModLoader.FABRIC
      ? ["fabric", "fabricloader", "minecraft", "java"]
      : ["forge", "minecraft", "fml"]
  );
  collection.forEach((c) => {
    allProvided.add(c.name);
  });
  for (const x of collection) {
    for (const d of x.depends) {
      if (!allProvided.has(d)) {
        o.push({ name: x.name, origin: x.origin, missing: d });
      }
    }
  }
  return o;
}

export async function getModType(mod: string): Promise<ModLoader> {
  try {
    const zip = new StreamZip.async({ file: mod });
    const entries = await zip.entries();
    for (const e of Object.keys(entries)) {
      try {
        if (e === "fabric.mod.json") {
          return ModLoader.FABRIC;
        }
        if (e === "META-INF/mods.toml" /* || e === "mcmod.info" */) {
          return ModLoader.FORGE;
        }
      } catch {}
    }
    return ModLoader.UNKNOWN;
  } catch {
    return ModLoader.UNKNOWN;
  }
}

// Support for mcmod.info has been dropped

export async function unfoldForgeTomlJar(
  source: string
): Promise<ShortModDepUnit[]> {
  const zip = new StreamZip.async({ file: source });
  const entries = await zip.entries();
  const o: ShortModDepUnit[] = [];
  for (const f of Object.keys(entries)) {
    if (f === "mods.toml") {
      const s = toml.parse((await zip.entryData(f)).toString());
      const deps = s.dependencies || [];
      const mods = s.mods || [];
      if (mods instanceof Array) {
        for (const m of mods) {
          if (m.modId) {
            const depRaw = deps[m.modId];
            const o0: string[] = [];
            if (depRaw instanceof Array) {
              for (const d of depRaw) {
                if (d.modId) {
                  o0.push(String(d.modId));
                }
              }
            }
            o.push({ name: String(m.modId), depends: o0 });
          }
        }
      }
    }
  }
  return o;
}
export function unfoldFabricJar(
  source: Buffer | string
): Promise<ShortModDepUnit[]> {
  return new Promise<ShortModDepUnit[]>((res) => {
    const fun = (e: unknown, zip?: ZipFile) => {
      if (e || !zip) {
        res([]);
        return;
      }
      zip.on("error", () => {
        res([]);
        return;
      });

      const ret0: ShortModDepUnit[] = [];
      const cachedEnts: Map<string, Entry> = new Map();
      const targetJars: string[] = [];
      let name: string;
      let depends: Record<string, string>;
      zip.on("end", async () => {
        depends = depends || {};
        if (name) {
          ret0.push({ name: name, depends: Object.keys(depends) });
        }
        // Solve deps
        await Promise.allSettled(
          targetJars.map((j) => {
            return new Promise<void>((res) => {
              const p = cachedEnts.get(j);
              if (p) {
                zip.openReadStream(p, async (e, s) => {
                  if (e || !s) {
                    res();
                    return;
                  }
                  ret0.push(...(await unfoldFabricJar(await bufferRead(s))));
                  res();
                });
              } else {
                res();
              }
            });
          })
        );
        res(ret0);
      });
      zip.on("entry", (ent: Entry) => {
        if (ent.fileName === "fabric.mod.json") {
          zip.openReadStream(ent, async (e, s) => {
            if (e || !s) {
              res([]);
              return;
            }
            const j = await bufferRead(s);
            const obj = JSON.parse(escapeQuote(j.toString()));
            const jars = safeGet(obj, ["jars"], null);
            name = String(safeGet(obj, ["id"], ""));
            depends = (safeGet(obj, ["depends"], {}) || {}) as Record<
              string,
              string
            >;
            if (jars instanceof Array) {
              jars.forEach((j) => {
                targetJars.push(j.file);
              });
            }
          });
        } else {
          cachedEnts.set(ent.fileName, ent);
        }
      });
    };
    if (typeof source === "string") {
      yauzl.open(source, {}, fun); // Read from file
    } else {
      yauzl.fromBuffer(source, {}, fun);
    }
  });
}

function bufferRead(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffers: any[] = [];
    stream.on("error", reject);
    stream.on("data", (data) => buffers.push(data));
    stream.on("end", () => resolve(Buffer.concat(buffers)));
  });
}
