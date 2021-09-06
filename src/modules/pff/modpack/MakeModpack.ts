import { zip } from "compressing";
import { copy, ensureDir, writeFile } from "fs-extra";
import { dirname, join } from "path";
import { basicHash } from "../../commons/BasicHash";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { CommonModpackModel, OverrideFile } from "./CommonModpackModel";
import { MANIFEST_FILE, OVERRIDE_CONTENT, PACK_META } from "./InstallModpack";
import {
  buildCFModpackJSON,
  buildCommonModpackJSON,
  convertCommonToCF,
} from "./ModpackBuilder";

export async function writeTempPackCommon(
  model: CommonModpackModel,
  container: MinecraftContainer
): Promise<void> {
  const TMP_DIR = basicHash(model.name).slice(6);
  const ROOT_DIR = container.getTempFileStorePath(TMP_DIR);
  await ensureDir(ROOT_DIR);
  const jContent = buildCommonModpackJSON(model);
  const cContent = buildCFModpackJSON(convertCommonToCF(model));
  // Manifests
  await writeFile(join(ROOT_DIR, MANIFEST_FILE), cContent);
  await writeFile(join(ROOT_DIR, PACK_META), jContent);
  // Prepare files
  await Promise.all(
    model.files.map(async (f) => {
      // @ts-ignore
      if (f["path"]) {
        f = f as OverrideFile;
        const origin = join(container.rootDir, f.path);
        const target = join(ROOT_DIR, OVERRIDE_CONTENT, f.path);
        await ensureDir(dirname(target));
        await copy(origin, target, { dereference: true }); // ASC
      }
    })
  );
}

export async function compressPack(
  source: string,
  outputDir: string,
  name: string
): Promise<void> {
  await zip.compressDir(
    source,
    join(outputDir, name.toLowerCase() + ".prod.zip")
  );
}
