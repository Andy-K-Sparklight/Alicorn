import { tgz } from "compressing";
import fs from "fs-extra";
import StreamZip from "node-stream-zip";
import os from "os";
import path from "path";
export enum FileType {
  MOD = "Mod",
  MODPACK = "ModPack",
  SHADER_PACK = "ShaderPack",
  RESOURCE_PACK = "ResourcePack",
  ALICORN_UPDATE = "AlicornUpdate",
  DISPLAY_MANAGER = "DisplayManager",
  UNKNOWN = "Unknown",
}

export async function justifyFileType(file: string): Promise<FileType> {
  try {
    const tmpDir = path.join(os.tmpdir(), "alicorn-justify-file");
    await fs.ensureDir(tmpDir);
    if (
      file.toLowerCase().endsWith(".zip") ||
      file.toLowerCase().endsWith(".jar")
    ) {
      const zip = new StreamZip.async({ file: file });
      const ent = await zip.entries();
      for (const f of Object.values(ent)) {
        if (
          f.name === "manifest.json" ||
          f.name === "mmc-pack.json" ||
          f.name === "mcbbs.packmeta"
        ) {
          return FileType.MODPACK;
        }
        if (f.name === "pack.mcmeta") {
          return FileType.RESOURCE_PACK;
        }
        if (f.name.startsWith("shaders/")) {
          return FileType.SHADER_PACK;
        }
        if (
          f.name === "META-INF/mods.toml" ||
          f.name === "fabric.mod.json" ||
          f.name === "mcmod.info"
        ) {
          return FileType.MOD;
        }
        if (f.name.startsWith("Alicorn") && f.name.endsWith("Renderer.js")) {
          return FileType.ALICORN_UPDATE;
        }
      }
      return FileType.UNKNOWN;
    } else if (
      file.toLowerCase().endsWith(".tar.gz") ||
      file.toLowerCase().endsWith(".tgz")
    ) {
      await fs.emptyDir(tmpDir);
      await tgz.uncompress(file, tmpDir);
      const fx = await fs.readdir(tmpDir);
      for (const f of fx) {
        if (
          f === "manifest.json" ||
          f === "mmc-pack.json" ||
          f === "mcbbs.packmeta"
        ) {
          return FileType.MODPACK;
        }
        if (f === "pack.mcmeta") {
          return FileType.RESOURCE_PACK;
        }
        if (f === "shaders") {
          return FileType.SHADER_PACK;
        }
        if (f.startsWith("Alicorn")) {
          return FileType.ALICORN_UPDATE;
        }
      }
      return FileType.UNKNOWN;
    } else if (file.endsWith(".aldm")) {
      return FileType.DISPLAY_MANAGER;
    } else {
      return FileType.UNKNOWN;
    }
  } catch {
    return FileType.UNKNOWN;
  }
}
