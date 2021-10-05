import childProcess from "child_process";
import { remove } from "fs-extra";
import os from "os";
import sudo from "sudo-prompt";
import { submitInfo } from "../../renderer/Message";
import { tr } from "../../renderer/Translator";
import { uniqueHash } from "../commons/BasicHash";
import { isFileExist } from "../commons/FileUtil";
import { getActualDataPath, saveDefaultDataAs } from "../config/DataSupport";
/*
CLAIM FOR EXTERNAL RESOURCE

This modules (BootEdge.ts) uses N2N Edge (edge-win.ald and edge-gnu.ald), which is ntop's work.
N2N Edge is licensed under the GNU GENERAL PUBLIC LICENSE 3.0 (aka. GPL-3.0) and it's a free software (free as in freedom).
It's license is compatible with ours, since we use GPL-3.0 too.
For details, please see https://github.com/ntop/n2n/blob/dev/LICENSE

A copy of edge-win.ald and edge-gnu.ald will be saved to the root dir of alicorn data.
*/
const INTERNET = "internet";
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

const TAP_NAME = "tap.exe";
const TAP_ORIGIN = "tap-win.ald";
const TAP_INSTALLED_BIT = "CutieConnet.TAPInstalled";

export async function installTAPDeviceWin(): Promise<void> {
  if (os.platform() !== "win32") {
    return;
  }
  await saveDefaultDataAs(TAP_ORIGIN, TAP_NAME);
  await waitTAPInstaller(getActualDataPath(TAP_NAME));
}

export function waitTAPInstaller(t: string): Promise<void> {
  return new Promise<void>((res) => {
    void (() => {
      const s = childProcess.spawn(t);
      s.on("exit", () => {
        res();
      });
      s.on("error", () => {
        res();
      });
    })();
  });
}

const EDGE_LOCK_FILE = "proc.lock";
export function generateEdgeArgs(
  community: string,
  psw: string,
  ip: string,
  supernode: string
): string {
  const o = [
    "-c",
    community === INTERNET ? INTERNET : uniqueHash(community),
    "-l",
    supernode,
  ]
    .concat(ip.length > 0 ? ["-a", ip] : [])
    .concat(
      psw.length > 0 && community !== INTERNET ? ["-k", uniqueHash(psw)] : []
    ) // Beat command inject!
    .join(" ");
  return os.platform() === "win32"
    ? `echo 0 >> "${getActualDataPath(
        EDGE_LOCK_FILE
      )}" && start "CutieConnect N2N Edge" "${getActualDataPath(
        getEdgeTargetName()
      )}" ${o}`
    : `sh -c "echo 0 >> '${getActualDataPath(
        EDGE_LOCK_FILE
      )}' && '${getActualDataPath(getEdgeTargetName())}' -f ${o}"`;
}

function queryFile(f: string): Promise<void> {
  return new Promise<void>((res) => {
    const i = setInterval(async () => {
      if (await isFileExist(f)) {
        clearInterval(i);
        res();
        await remove(f);
      }
    }, 500);
  });
}

export async function runEdge(
  community: string,
  psw: string,
  ip: string,
  supernode: string
): Promise<void> {
  if (
    window.localStorage.getItem(TAP_INSTALLED_BIT) !== "1" &&
    os.platform() === "win32"
  ) {
    submitInfo(tr("Utilities.CutieConnect.InstallingTAP"));
    await new Promise<void>((res) => {
      setTimeout(() => {
        res();
      }, 3000);
    });
    await installTAPDeviceWin();
    window.localStorage.setItem(TAP_INSTALLED_BIT, "1");
  }
  const cmd = generateEdgeArgs(community, psw, ip, supernode);
  console.log("Starting edge with command line: " + cmd);

  sudo.exec(cmd, {
    name: "Alicorn Sudo Prompt Actions",
  });
  await queryFile(getActualDataPath(EDGE_LOCK_FILE));
}

export function killEdge(): Promise<void> {
  const cmd = os.platform() === "win32" ? "tskill edge" : "pkill edge";
  console.log("Terminating edge...");
  return new Promise<void>((res) => {
    sudo.exec(
      cmd,
      {
        name: "Alicorn Sudo Prompt Actions",
      },
      () => {
        res(); // This should work
      }
    );
  });
}
