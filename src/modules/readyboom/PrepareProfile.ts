import objectHash from "object-hash";
import { getBoolean, getNumber } from "../config/ConfigSupport";
import { scanCoresInAllMountedContainers } from "../container/ContainerScanner";
import { getAllMounted, getContainer } from "../container/ContainerUtil";
import { MinecraftContainer } from "../container/MinecraftContainer";
import {
  ensureAllAssets,
  ensureAssetsIndex,
  ensureClient,
  ensureLibraries,
  ensureLog4jFile,
  ensureNatives,
} from "../launch/Ensurance";
import { loadProfile } from "../profile/ProfileLoader";
import { whatProfile } from "../profile/WhatProfile";

const READY_MAP: Map<string, Promise<boolean>> = new Map(); // No two jobs run at the same time or there might be conflicts, just wait for the Promise finish

const READY_SET: Set<string> = new Set();
const LAST_USED_KEY = "ReadyToLaunch.LastUsed";

export function setDirtyProfile(container: string, id: string): void {
  READY_MAP.delete(container + "/" + id);
  READY_SET.delete(container + "/" + id);
}

export function isProfileReady(container: string, id: string): boolean {
  return READY_SET.has(container + "/" + id);
}

export function willProfileBeReady(container: string, id: string): boolean {
  return isProfileReady(container, id) || READY_MAP.has(container + "/" + id);
}

export function waitProfileReady(
  container: string,
  id: string
): Promise<boolean> {
  const k = container + "/" + id;
  if (READY_SET.has(k)) {
    // Already available
    return Promise.resolve(true);
  }
  if (!READY_MAP.has(k)) {
    // Not started
    return Promise.resolve(false);
  }
  return READY_MAP.get(k) as Promise<boolean>;
}

export function setLastUsed(container: string, id: string) {
  localStorage.setItem(LAST_USED_KEY, container + "/" + id);
}

export async function prepareProfile(
  container: MinecraftContainer,
  id: string
): Promise<boolean> {
  try {
    const profile = await loadProfile(id, container);
    await ensureAssetsIndex(profile, container);
    await Promise.all([
      ensureClient(profile),
      ensureLog4jFile(profile, container),
      (async () => {
        await ensureLibraries(profile, container);
        await ensureNatives(profile, container);
      })(),
      (async () => {
        await ensureAllAssets(profile, container);
      })(),
    ]); // Parallel
    return true;
  } catch {
    return false;
  }
}

export async function scanAndActivateHotProfiles(): Promise<void> {
  const rMap = await scanCoresInAllMountedContainers(false);
  const cores = [];
  for (const [c, ids] of rMap.entries()) {
    for (const id of ids) {
      try {
        const p = await loadProfile(id, c, true); // Faster
        cores.push({
          id: p.id,
          baseVersion: p.baseVersion,
          location: c.id + "/" + id,
          versionType: whatProfile(id),
          corrupted: false,
          container: c.id,
        });
      } catch {}
    }
  }
  cores.sort((a, b) => {
    const hashA = objectHash(a);
    const hashB = objectHash(b);
    const pinA = getUsed(hashA);
    const pinB = getUsed(hashB);
    return pinB - pinA;
  });
  let c = 0;
  let b;
  const os = [];
  while (
    c < getNumber("readyboom.cores") &&
    (b = cores.shift()) !== undefined
  ) {
    os.push(b);
    c++;
  }
  const lastCoreUsed = localStorage.getItem(LAST_USED_KEY);
  if (lastCoreUsed) {
    const [ct, id] = lastCoreUsed.split("/");
    const a = os.map((d) => {
      return d.container + "/" + d.id;
    });
    if (!a.includes(lastCoreUsed)) {
      if (getAllMounted().includes(ct)) {
        try {
          const p = await loadProfile(id, getContainer(ct), true);
          os.unshift({
            id: p.id,
            container: ct,
          });
          if (os.length > getNumber("readyboom.cores")) {
            os.pop();
          }
        } catch {}
      }
    }
  }
  await Promise.all(
    os.map((b) => {
      const k = b.container + "/" + b.id;
      if (willProfileBeReady(b.container, b.id)) {
        return Promise.resolve(true);
      }
      console.log(`[ReadyBoom] Preparing core ${b.container}/${b.id}`);
      const prom = prepareProfile(getContainer(b.container), b.id);
      READY_MAP.set(k, prom);
      void prom
        .then((f) => {
          if (f) {
            console.log(`[ReadyBoom] Core ${b.container}/${b.id} is ready.`);
            READY_SET.add(k);
          }
          READY_MAP.delete(k);
        })
        .catch(() => {});
    })
  );
}

const PIN_NUMBER_KEY = "PinIndex.";
function getUsed(hash: string): number {
  return parseInt(localStorage.getItem(PIN_NUMBER_KEY + hash) || "0") || 0;
}

export function setupHotProfilesService(): void {
  if (!getBoolean("readyboom")) {
    return;
  }
  void scanAndActivateHotProfiles();
  window.addEventListener("GameQuit", () => {
    void scanAndActivateHotProfiles();
  });
}
