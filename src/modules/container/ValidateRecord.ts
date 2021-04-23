import { ALICORN_DATA_SUFFIX } from "../commons/Constants";
import {
  getActualDataPath,
  loadData,
  saveData,
  saveDataSync,
} from "../config/DataSupport";
import { isFileExist } from "../config/FileUtil";
import { buildMap, parseMap } from "../commons/MapUtil";
import path from "path";
import { isNull } from "../commons/Null";

const VALIDATE_FILE = "f.record" + ALICORN_DATA_SUFFIX;
let VF: Map<string, string> = new Map();

export async function saveDefaultVF(): Promise<void> {
  if (!(await isFileExist(getActualDataPath(VALIDATE_FILE)))) {
    await saveData(VALIDATE_FILE, "");
  }
}

export async function loadVF(): Promise<void> {
  try {
    VF = parseMap(await loadData(VALIDATE_FILE));
  } catch {}
}

export async function initVF(): Promise<void> {
  await saveDefaultVF();
  await loadVF();
}

export function getLastValidateModified(file: string): Date {
  const f = VF.get(path.resolve(file));
  return new Date(isNull(f) ? 0 : String(f));
}

export function updateRecord(file: string): void {
  VF.set(path.resolve(file), new Date().toUTCString());
}

export function deleteRecord(file: string): void {
  VF.delete(path.resolve(file));
}

export function saveVFSync(): void {
  saveDataSync(VALIDATE_FILE, buildMap(VF));
}
