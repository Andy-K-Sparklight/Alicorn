import { loadData, saveData, saveDataSync } from "../config/DataSupport";

let SERVERS: string[] = [];
const SERVERS_NAME = "servers.csv";
export async function loadServers(): Promise<void> {
  try {
    SERVERS = (await loadData(SERVERS_NAME)).split(",");
  } catch {}
}

export async function saveServers(): Promise<void> {
  try {
    await saveData(SERVERS_NAME, SERVERS.join(","));
  } catch {}
}
export function saveServersSync(): void {
  saveDataSync(SERVERS_NAME, SERVERS.join(","));
}
