import { buildMap, parseMap } from "../commons/MapUtil";
import { loadData, saveData, saveDataSync } from "../config/DataSupport";

const LOCK_FILE = "pff.lock";
let LOCK_MAP: Map<string, string> = new Map();

export async function initResolveLock(): Promise<void> {
  LOCK_MAP = parseMap(await loadData(LOCK_FILE));
}

export async function saveResolveLock(): Promise<void> {
  await saveData(LOCK_FILE, buildMap(LOCK_MAP));
}

export function saveResolveLockSync(): void {
  saveDataSync(LOCK_FILE, buildMap(LOCK_MAP));
}

// XXX Conflict warning
export function addRecord(hash: string, url: string): void {
  LOCK_MAP.set(hash, url);
}

export function deleteRecord(hash: string): void {
  LOCK_MAP.delete(hash);
}

export function queryRecord(hash: string): string {
  return LOCK_MAP.get(hash) || "";
}
