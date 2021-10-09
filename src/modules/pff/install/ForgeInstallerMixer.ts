import { zip } from "compressing";
import fs from "fs-extra";
import { createWriteStream } from "original-fs";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";
import { uniqueHash } from "../../commons/BasicHash";
import { MinecraftContainer } from "../../container/MinecraftContainer";

const pipe = promisify(pipeline);

export async function rebuildForgeInstaller(
  container: MinecraftContainer,
  source: string
): Promise<void> {
  const tDir = container.getTempFileStorePath(uniqueHash(source));
  await fs.ensureDir(tDir);
  await zip.uncompress(source, tDir);
  const tJson = path.join(tDir, "install_profile.json");
  const j = await fs.readJSON(tJson);
  const processors = j["processors"];
  if (processors instanceof Array) {
    for (const [i, x] of processors.entries()) {
      if (x.args instanceof Array) {
        if (x.args.includes("DOWNLOAD_MOJMAPS")) {
          processors.splice(i, 1); // Remove this task
          break;
        }
      }
    }
  }
  await fs.writeJSON(tJson, j);
  await fs.remove(path.join(tDir, "META-INF")); // Dispose sign
  const files = await fs.readdir(tDir);
  const oStream = new zip.Stream();
  for (const f of files) {
    oStream.addEntry(path.join(tDir, f));
  }
  const target = source + ".patched.jar";
  const o = createWriteStream(target);
  await pipe(oStream, o);
  await fs.remove(source);
  await fs.move(target, source);
  await fs.remove(tDir);
}
