import { machineId } from "node-machine-id";

let machineIDCache = "";

export async function getMachineUniqueID(): Promise<string> {
  if (machineIDCache !== "") {
    return machineIDCache;
  }
  const id = await machineId();
  machineIDCache = id;
  return id;
}
