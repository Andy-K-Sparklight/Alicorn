import { tgz } from "compressing";
import { copy, ensureDir } from "fs-extra";
import path from "path";
import React from "react";
import { jumpTo, triggerSetPage } from "../../renderer/GoTo";
import { submitInfo, submitSucc } from "../../renderer/Message";
import { tr } from "../../renderer/Translator";
import { getActualDataPath } from "../config/DataSupport";
import { getAllMounted, getContainer } from "../container/ContainerUtil";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { updateFromSource } from "../selfupdate/Updator";
import { FileType, justifyFileType } from "./FileType";

export async function handleDnD(
  e: React.DragEvent<HTMLElement>
): Promise<void> {
  const f = e.dataTransfer.files;
  if (f.length > 0) {
    submitInfo(tr("System.DnDProcessing"));
    await handleFiles(f);
  }
}

async function handleFiles(files: FileList): Promise<void> {
  const fTypes: Map<string, FileType> = new Map();
  let modpack = "";
  // let isUpdate = false;
  const allp = [];
  for (const x of files) {
    allp.push(
      (async () => {
        const t = await justifyFileType(x.path);
        fTypes.set(x.path, t);
        if (t === FileType.MODPACK) {
          modpack = x.path;
        }
        /* if (t === FileType.ALICORN_UPDATE) {
          isUpdate = true;
        } */
      })()
    );
  }
  await Promise.allSettled(allp);
  if (modpack) {
    jumpTo(`/ContainerManager/${encodeURIComponent(modpack)}`);
    triggerSetPage("ContainerManager");
    return;
  }
  const opm: Promise<void>[] = [];
  for (const fx of fTypes.keys()) {
    for (const c of getAllMounted()) {
      opm.push(
        genDeployTask(fx, fTypes.get(fx) || FileType.UNKNOWN, getContainer(c))
      );
    }
  }
  await Promise.allSettled(opm);
  submitSucc(tr("System.DnDOK"));
}
async function genDeployTask(
  f: string,
  type: FileType,
  c: MinecraftContainer
): Promise<void> {
  if (type === FileType.MOD) {
    await ensureDir(c.getModsRoot());
    await copy(f, c.getModJar(path.basename(f)));
  }
  if (type === FileType.RESOURCE_PACK) {
    await ensureDir(c.getResourcePacksRoot());
    await copy(f, path.join(c.getResourcePacksRoot(), path.basename(f)));
  }
  if (type === FileType.SHADER_PACK) {
    await ensureDir(c.getShaderPacksRoot());
    await copy(f, path.join(c.getShaderPacksRoot(), path.basename(f)));
  }
  if (type === FileType.ALICORN_UPDATE) {
    await updateFromSource(f);
  }
  if (type === FileType.DISPLAY_MANAGER) {
    const target = getActualDataPath(
      path.join("dms", path.basename(f, ".aldm"))
    );
    await ensureDir(target);
    await tgz.uncompress(f, target);
  }
}
