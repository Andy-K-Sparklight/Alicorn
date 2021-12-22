import path from "path";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { ProfileType } from "../../profile/WhatProfile";
import {
  ModpackModel,
  SimpleFile,
  SimpleModLoaderInfo,
} from "./CFModpackModel";
import { CommonModpackModel, OverrideFile } from "./CommonModpackModel";
import { OVERRIDE_CONTENT } from "./InstallModpack";

export function createBaseCommonModel(): CommonModpackModel {
  return {
    name: "MyModpack",
    version: "0.1",
    author: "Me",
    description: "Hello, world!",
    url: "",
    addons: [],
    files: [],
    overrideSourceDir: "overrides",
  };
}

export function addPffMod(
  addonId: string,
  fileId: string,
  model: ModpackModel | CommonModpackModel
): void {
  const aid: string | number =
    parseInt(addonId).toString() === addonId ? parseInt(addonId) : addonId;
  const fid: string | number =
    parseInt(fileId).toString() === fileId ? parseInt(fileId) : fileId;
  for (let f of model.files) {
    // @ts-ignore
    if (f["projectID"]) {
      f = f as SimpleFile;
      if (f.projectID === aid && f.fileID === fid) {
        return;
      }
    }
  }
  model.files.push({ projectID: aid, fileID: fid });
}

export function addOverride(
  pt: string,
  rootContainer: MinecraftContainer,
  model: CommonModpackModel,
  hash = "",
  force = true
): void {
  pt = path.normalize(pt);
  if (path.isAbsolute(pt)) {
    pt = path.relative(rootContainer.rootDir, pt);
  }
  for (let c of model.files) {
    // @ts-ignore
    if (!c["projectID"]) {
      c = c as OverrideFile;
      if (c.path === pt) {
        return;
      }
    }
  }
  model.files.push({ path: pt, hash: hash, force: force });
}

export function addCore(
  type: string,
  version: string,
  model: CommonModpackModel | ModpackModel,
  mcversion?: string
): void {
  type = type.trim().toLowerCase();
  // @ts-ignore
  if (model.baseVersion) {
    if (type === "game") {
      model = model as ModpackModel;
      model.baseVersion = version;
    }
  } else {
    model = model as CommonModpackModel;
    for (const a of model.addons) {
      if (a.id.trim().toLowerCase() === type && a.version === version) {
        return;
      }
    }
    model.addons.push({
      id: type,
      version: version,
      mcversion: mcversion,
      "-al-mcversion": mcversion,
    });
  }
}

export function convertCommonToCF(model: CommonModpackModel): ModpackModel {
  return {
    displayName: model.name,
    author: model.author,
    baseVersion: findGameBase(model),
    overrideSourceDir: OVERRIDE_CONTENT,
    files: trimFiles(model),
    modLoaders: getModLoaders(model),
    packVersion: model.version,
  };
}

function getModLoaders(model: CommonModpackModel): SimpleModLoaderInfo[] {
  const p: SimpleModLoaderInfo[] = [];
  model.addons.forEach((a) => {
    switch (a.id.toLowerCase()) {
      case "forge":
        p.push({ type: ProfileType.FORGE, version: a.version });
        break;
      case "fabric":
      default:
        p.push({ type: ProfileType.FABRIC, version: a.version }); // Fabric mcv will be discarded
    }
  });
  return p;
}

function trimFiles(model: CommonModpackModel): SimpleFile[] {
  const p: SimpleFile[] = [];
  model.files.forEach((f) => {
    // @ts-ignore
    if (f["projectID"]) {
      p.push(f as SimpleFile);
    }
  });
  return p;
}
function findGameBase(model: CommonModpackModel): string {
  for (const a of model.addons) {
    if (a.id.trim().toLowerCase() === "game") {
      return a.version;
    }
  }
  return "";
}

export function buildCommonModpackJSON(model: CommonModpackModel): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o: any = {};
  o.manifestType = "minecraftModpack";
  o.manifestVersion = 2;
  o.name = model.name;
  o.version = model.version;
  o.author = model.author;
  o.description = model.description;
  o.fileApi = ""; // Currently not supported
  o.url = model.url;
  o.forceUpdate = false; // DO NOT FORCE UPDATE
  o.origin = []; // Currently don't know how to use
  o.addons = [];
  for (const x of model.addons) {
    o.addons.push({
      id: x.id,
      version: x.version,
      mcversion: x.mcversion || undefined,
      "-al-mcversion": x["-al-mcversion"] || undefined,
    });
  }
  o.libraries = []; // Currently don't know how to use
  o.files = [];
  for (let f of model.files) {
    // @ts-ignore
    if (!f["projectID"]) {
      o.files.push(Object.assign({ type: "addon" }, f));
    } else {
      f = f as SimpleFile;
      o.files.push({ projectID: f.projectID, fileID: f.fileID });
    }
  }
  o.settings = {
    install_mods: true,
    install_resourcepack: true, // Currently don't know how to use
  };
  o.launchInfo = {
    minMemory: 0,
    launchArgument: [],
    javaArgument: [], // Safety
  };
  return JSON.stringify(o);
}

export function buildCFModpackJSON(model: ModpackModel): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o: any = {};
  o.manifestType = "minecraftModpack";
  o.manifestVersion = 1;
  o.name = model.displayName;
  o.version = model.packVersion;
  o.author = model.author;
  o.overrides = OVERRIDE_CONTENT; // Lock
  o.minecraft = {
    version: model.baseVersion,
    modLoaders: model.modLoaders.map((m) => {
      return {
        id: m.type.toLowerCase() + "-" + m.version,
        primary: false,
      };
    }),
  };
  if (o.minecraft.modLoaders.length > 0) {
    o.minecraft.modLoaders[0].primary = true; // Activate
  }
  o.files = model.files.map((f) => {
    return {
      projectID: f.projectID,
      fileID: f.fileID,
    };
  });
  return JSON.stringify(o);
}
