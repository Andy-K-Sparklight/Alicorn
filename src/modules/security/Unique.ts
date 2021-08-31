import { machineId } from "node-machine-id";
import { uniqueHash } from "../commons/BasicHash";

let machineIDCache = "";

export async function getMachineUniqueID(): Promise<string> {
  if (machineIDCache !== "") {
    return machineIDCache;
  }
  const id = await machineId();
  machineIDCache = id;
  return id;
}
export function instantGetMachineUniqueID(): string {
  return uniqueHash(machineIDCache);
}

export function generateWorldAnyUniqueId(): string {
  const mid =
    machineIDCache.length > 0
      ? machineIDCache
      : uniqueHash(Math.random().toString());
  const date = new Date().getTime();
  return uniqueHash(date + "-" + mid).slice(); // Do not keep sensitive data
}
