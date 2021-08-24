import os from "os";
import sudo from "sudo-prompt";
import { getActualDataPath, saveDefaultDataAs } from "../config/DataSupport";

let EDGE_LOCK = false; // One instance once
export async function prepareEdgeExecutable(): Promise<void> {
  await saveDefaultDataAs(getEdgeName(), getEdgeTargetName());
}

export function getEdgeName(): string {
  if (os.platform() === "win32") {
    return "edge-win.ald";
  } else {
    return "edge-gnu.ald";
  }
}

export function getEdgeTargetName(): string {
  if (os.platform() === "win32") {
    return "edge.exe";
  } else {
    return "edge";
  }
}

export function generateEdgeArgs(
  community: string,
  psw: string,
  ip: string,
  supernode: string
): string {
  const o = ["-a", ip, "-c", community, "-k", psw, "-l", supernode].join(" ");
  return os.platform() === "win32"
    ? `start "${getActualDataPath(getEdgeTargetName())}" ${o}`
    : `bash -c "'${getActualDataPath(getEdgeTargetName())}' ${o}"`;
}

export function runEdge(
  community: string,
  psw: string,
  ip: string,
  supernode: string
): void {
  if (EDGE_LOCK) {
    throw "Edge is already running!";
  }
  EDGE_LOCK = true;
  const cmd = generateEdgeArgs(community, psw, ip, supernode);
  sudo.exec(cmd, {
    name: "Alicorn Sudo Prompt Actions",
  });
  console.log("Starting edge with command line: " + cmd);
}

export function killEdge(): void {
  const cmd = os.platform() === "win32" ? "taskkill edge" : "pkill edge";
  EDGE_LOCK = false; // This will not work fine if user cancelled, but normally then won't
  sudo.exec(cmd, {
    name: "Alicorn Sudo Prompt Actions",
  });
  console.log("Terminating edge...");
}
