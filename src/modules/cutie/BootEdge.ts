import childProcess from "child_process";
import os from "os";
import sudo from "sudo-prompt";
import { submitInfo, submitWarn } from "../../renderer/Message";
import { tr } from "../../renderer/Translator";
import { uniqueHash } from "../commons/BasicHash";
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

const ELEVATOR = "elevate.ald";
const ELEVATOR_TARGET = "elevate.exe";

export async function prepareElevate(): Promise<void> {
  await saveDefaultDataAs(ELEVATOR, ELEVATOR_TARGET);
}

export function waitWindowsEdgeBoot(
  community: string,
  psw: string,
  ip: string,
  supernode: string
): Promise<void> {
  const oArgs = [
    "-c",
    community === INTERNET ? INTERNET : uniqueHash(community),
    "-l",
    supernode,
  ]
    .concat(ip.length > 0 ? ["-a", ip] : [])
    .concat(
      psw.length > 0 && community !== INTERNET ? ["-k", uniqueHash(psw)] : []
    );
  return new Promise<void>((res, rej) => {
    void (async () => {
      await prepareElevate();
      childProcess.execFile(
        getActualDataPath(ELEVATOR_TARGET),
        ["-k", "edge.exe", ...oArgs],
        {
          cwd: getActualDataPath("."),
        },
        (e) => {
          if (e) {
            rej(e);
          } else {
            res();
          }
        }
      );
    })();
  });
}

export function waitUNIXEdgeBoot(
  community: string,
  psw: string,
  ip: string,
  supernode: string
): Promise<void> {
  const oArgs = [
    "-c",
    community === INTERNET ? INTERNET : uniqueHash(community),
    "-l",
    supernode,
  ]
    .concat(ip.length > 0 ? ["-a", ip] : [])
    .concat(
      psw.length > 0 && community !== INTERNET ? ["-k", uniqueHash(psw)] : []
    );
  return new Promise<void>((res, rej) => {
    let resolved = false;
    const p = childProcess.spawn(
      "pkexec",
      [getActualDataPath(getEdgeTargetName()), ...oArgs],
      {
        cwd: getActualDataPath("."),
        detached: true,
      }
    );
    p.once("error", (e) => {
      if (!resolved) {
        rej(e);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fun = (d: any) => {
      if (!resolved) {
        if (d.toString().toLowerCase().includes("error")) {
          rej("Elevate cancelled by user");
        }
        resolved = true;
        res();
      }
    };
    p.stdout.once("data", fun);
    p.stderr.once("data", fun);
  });
}

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
      const s = childProcess.exec(`"${t}"`);
      s.on("exit", () => {
        res();
      });
      s.on("error", () => {
        res();
      });
    })();
  });
}

export function generateEdgeArgsUnix(
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
  return `sh -c "'${getActualDataPath(getEdgeTargetName())}' ${o} &"`;
}

export async function runEdge(
  community: string,
  psw: string,
  ip: string,
  supernode: string
): Promise<void> {
  if (
    localStorage.getItem(TAP_INSTALLED_BIT) !== "1" &&
    os.platform() === "win32"
  ) {
    submitInfo(tr("Utilities.CutieConnect.InstallingTAP"));
    await new Promise<void>((res) => {
      setTimeout(() => {
        res();
      }, 3000);
    });
    await installTAPDeviceWin();
    localStorage.setItem(TAP_INSTALLED_BIT, "1");
  }
  try {
    if (os.platform() === "win32") {
      await waitWindowsEdgeBoot(community, psw, ip, supernode);
    } else {
      await waitUNIXEdgeBoot(community, psw, ip, supernode);
    }
  } catch (e) {
    submitWarn(tr("Utilities.CutieConnect.EdgeFailure", `Reason=${e}`));
  }
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
