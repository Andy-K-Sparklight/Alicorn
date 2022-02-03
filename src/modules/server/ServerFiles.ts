import { loadData, saveData } from "../config/DataSupport";

const SERVERS: Set<string> = new Set();
const SERVERS_NAME = "servers.csv";
export async function loadServers(): Promise<void> {
  try {
    const s2 = new Set((await loadData(SERVERS_NAME)).split(","));
    SERVERS.clear();
    s2.forEach((v) => {
      if (v.trim().length > 0) {
        SERVERS.add(trimServerAddress(v));
      }
    });
  } catch {}
}

export async function saveServers(): Promise<void> {
  try {
    await saveData(SERVERS_NAME, Array.from(SERVERS).join(","));
  } catch {}
}

export function getServerList(): string[] {
  return Array.from(SERVERS);
}

export function addServer(s: string): void {
  SERVERS.add(trimServerAddress(s));
}
export function removeServer(s: string): void {
  SERVERS.delete(trimServerAddress(s));
}
export function trimServerAddress(origin: string): string {
  origin = origin.trim();
  if (!origin.includes(":")) {
    return origin + ":25565";
  }
  return origin;
}
