import path from "path";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { ModpackModel, SimpleFile } from "./CFModpackModel";
import { CommonModpackModel, OverrideFile } from "./CommonModpackModel";

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

export function createBaseCFModel(): ModpackModel {
  return {
    displayName: "MyModpack",
    overrideSourceDir: "overrides",
    author: "Me",
    baseVersion: "1.17.1",
    modLoaders: [],
    files: [],
    packVersion: "0.1",
  };
}

export function addPffMod(
  addonId: number,
  fileId: number,
  model: ModpackModel | CommonModpackModel
): void {
  for (let f of model.files) {
    // @ts-ignore
    if (f["projectID"]) {
      f = f as SimpleFile;
      if (f.projectID === addonId && f.fileID === fileId) {
        return;
      }
    }
  }
  model.files.push({ projectID: addonId, fileID: fileId });
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
  model: CommonModpackModel | ModpackModel
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
    model.addons.push({ id: type, version: version });
  }
}

function buildCommonModpackJSON(model: CommonModpackModel): string {
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
    o.addons.push({ id: x.id, version: x.version });
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
