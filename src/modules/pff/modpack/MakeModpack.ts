import { zip } from "compressing";
import { copy, ensureDir, readdir, remove, stat, writeFile } from "fs-extra";
import { createWriteStream } from "original-fs";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";
import { basicHash } from "../../commons/BasicHash";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { getHash } from "../../download/Validate";
import { UnifiedAsset } from "./AssetScanner";
import { CommonModpackModel } from "./CommonModpackModel";
import { MANIFEST_FILE, OVERRIDE_CONTENT, PACK_META } from "./InstallModpack";
import {
  addCore,
  addOverride,
  addPffMod,
  buildCFModpackJSON,
  buildCommonModpackJSON,
  convertCommonToCF,
} from "./ModpackBuilder";
import {submitInfo} from "../../../renderer/Message";
import {tr} from "../../../renderer/Translator";

const pipe = promisify(pipeline);

export async function compressPack(
  source: string,
  outputDir: string,
  name: string
): Promise<void> {
  const files = await readdir(source);
  const zipStream = new zip.Stream();
  files.forEach((f) => {
    zipStream.addEntry(path.join(source, f));
  });
  const target = createWriteStream(
    path.join(outputDir, name.toLowerCase() + ".prod.zip")
  );
  await pipe(zipStream, target);
}

// So called 'compatible' with Curse, we'll just wait and see...
// This function works for cf pack since we use a convert.
export async function sealPackCommon(
  model: CommonModpackModel, // Should have assigned name etc.
  assets: UnifiedAsset[],
  container: MinecraftContainer,
  setState: (s: string) => unknown = () => {}
): Promise<void> {
  // Allocate work dir
  const MODPACK_WORK_DIR = container.getTempFileStorePath(
    basicHash(model.name).slice(6)
  );
  const VIRTUAL_MC_ROOT = path.join(MODPACK_WORK_DIR, OVERRIDE_CONTENT);
  await ensureDir(MODPACK_WORK_DIR);
  await ensureDir(VIRTUAL_MC_ROOT); // Overrides
  // Dedir
  setState("Resolving");
  assets = await dedir(assets);
  // Register to model
  setState("Indexing");
  await Promise.all(
    assets.map(async (a) => {
      switch (a.type) {
        case "ADDON":
          addCore(a.v1, a.v2, model, a.mcv);
          break;
        case "MOD": {
          addPffMod(a.v1, a.v2, model);
          break;
        }
        case "FILE": {
          // Copy file
          const pt = path.relative(container.rootDir, a.v1);
          const tpt = path.join(VIRTUAL_MC_ROOT, pt);
          await ensureDir(path.dirname(tpt));
          await copy(a.v1, tpt, { dereference: true });
          // Register
          addOverride(pt, container, model, a.v2, true);
        }
      }
    })
  );
  const j = buildCommonModpackJSON(model);
  const j2 = buildCFModpackJSON(convertCommonToCF(model));
  setState("Compressing");
  await writeFile(path.join(MODPACK_WORK_DIR, PACK_META), j);
  await writeFile(path.join(MODPACK_WORK_DIR, MANIFEST_FILE), j2);
  await compressPack(MODPACK_WORK_DIR, container.rootDir, model.name);
  await remove(MODPACK_WORK_DIR);
  submitInfo(tr("Utilities.BuildUp.Done"));
  setState("Build");
}

// Resolve DIR to FILE
async function dedir(assets: UnifiedAsset[]): Promise<UnifiedAsset[]> {
  let o: UnifiedAsset[] = [];
  await Promise.all(
    assets.map(async (u) => {
      if (u.type === "DIR") {
        const t: "FILE" | "MOD" | "ADDON" = "FILE";
        const r: string[] = [];
        await readFullDir(u.v1, r);
        o = o.concat(
          await Promise.all(
            r.map(async (r1) => {
              return {
                type: t,
                desc: u.desc,
                v1: r1,
                v2: await getHash(r1),
              };
            })
          )
        );
      } else {
        o.push(u);
      }
    })
  );
  return o;
}

async function readFullDir(dir: string, res: string[]): Promise<void> {
  try {
    const d = await readdir(dir);
    await Promise.all(
      d.map(async (f) => {
        const cf = path.join(dir, f);
        const s = await stat(cf);
        if (s.isDirectory()) {
          await readFullDir(cf, res);
        }
        if (s.isFile()) {
          res.push(cf);
        }
      })
    );
  } catch {}
}
