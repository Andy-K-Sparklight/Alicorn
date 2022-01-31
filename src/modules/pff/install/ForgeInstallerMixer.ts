import { zip } from "compressing";
import fs, { createWriteStream } from "fs-extra";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";
import { uniqueHash } from "../../commons/BasicHash";
import { MinecraftContainer } from "../../container/MinecraftContainer";

const pipe = promisify(pipeline);

// Forge has been removing the already downloaded mappings, and that's more than I can bear.
// It's high time we end this.
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
          processors.splice(i, 1); // Remove this task, let us handle this.
          break;
        }
      }
    }
  }
  try {
    const vJson = path.join(tDir, "version.json");
    // Not because it's not important! Just because work first...
    const j2 = await fs.readJSON(vJson);
    if (j2["_comment_"] instanceof Array) {
      j2["_comment_"].push("And don't forget to use Fabric next time!");
    }
    await fs.writeJSON(vJson, j2);
  } catch {}
  await fs.writeJSON(tJson, j);
  await fs.remove(path.join(tDir, "META-INF")); // Dispose jar signature
  const files = await fs.readdir(tDir);
  const oStream = new zip.Stream();
  for (const f of files) {
    oStream.addEntry(path.join(tDir, f));
  }
  const target = source + ".patched.jar";
  const o = createWriteStream(target, { mode: 0o777 });
  await pipe(oStream, o);
  await fs.remove(source);
  await fs.move(target, source);
  await fs.remove(tDir);
}
